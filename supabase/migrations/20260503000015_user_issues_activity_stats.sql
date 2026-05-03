-- User-created issues + activity log + stats view + threshold 20→5

-- ============================================================
-- 1. Lower rank threshold 20 → 5 (recreate accuracy views)
-- ============================================================
drop view if exists user_accuracy cascade;
drop view if exists user_accuracy_overall cascade;
drop view if exists user_accuracy_by_category cascade;

create view user_accuracy_by_category as
select
  j.user_id,
  i.category,
  count(*) filter (where j.is_correct is not null and j.counts_toward_rank) as settled_total,
  count(*) filter (where j.is_correct = true and j.counts_toward_rank) as correct_total,
  case
    when count(*) filter (where j.is_correct is not null and j.counts_toward_rank) >= 5
    then round(
      100.0 * count(*) filter (where j.is_correct = true and j.counts_toward_rank)
            / nullif(count(*) filter (where j.is_correct is not null and j.counts_toward_rank), 0)
    )
    else null
  end as accuracy_pct
from judgments j
join issues i on i.id = j.issue_id
where i.status in ('correct', 'wrong')
group by j.user_id, i.category;

create view user_accuracy_overall as
select
  user_id,
  'all'::text as category,
  sum(settled_total)::bigint as settled_total,
  sum(correct_total)::bigint as correct_total,
  case
    when sum(settled_total) >= 5
    then round(100.0 * sum(correct_total) / nullif(sum(settled_total), 0))
    else null
  end as accuracy_pct
from user_accuracy_by_category
group by user_id;

create view user_accuracy as
select user_id, category, settled_total, correct_total, accuracy_pct
from user_accuracy_by_category
union all
select user_id, category, settled_total, correct_total, accuracy_pct
from user_accuracy_overall;

-- ============================================================
-- 2. issues.review_status (admin-approval workflow for user-created)
-- ============================================================
alter table issues add column if not exists review_status text not null default 'approved'
  check (review_status in ('pending', 'approved', 'rejected'));

create index if not exists issues_review_status_idx on issues (review_status);

-- Drop old policies + rebuild
drop policy if exists issues_select_all on issues;
drop policy if exists issues_admin_all on issues;

-- Public sees only approved; creator sees own pending/rejected; admin sees all
create policy issues_select_visible on issues
  for select using (
    review_status = 'approved'
    or auth.uid() = creator_id
    or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- Authenticated non-banned users can insert pending issues
create policy issues_insert_user on issues
  for insert with check (
    auth.uid() = creator_id
    and review_status = 'pending'
    and not exists (select 1 from profiles where id = auth.uid() and is_banned = true)
  );

-- Admin can do anything
create policy issues_admin_all on issues
  for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- Settlement source URL must be http(s) — applies only to new rows
alter table issues drop constraint if exists issues_settlement_source_url;
alter table issues add constraint issues_settlement_source_url
  check (settlement_source is null or settlement_source ~* '^https?://[^[:space:]]+$')
  not valid;

-- ============================================================
-- 3. Activity log (per-event notifications)
-- ============================================================
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  actor_id uuid references profiles(id) on delete cascade,
  kind text not null check (kind in ('like', 'comment', 'follow', 'settle', 'issue_approved', 'issue_rejected')),
  post_id uuid references posts(id) on delete cascade,
  comment_id uuid references comments(id) on delete cascade,
  issue_id uuid references issues(id) on delete cascade,
  is_correct boolean,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_user_idx on activity_log (user_id, created_at desc);

alter table activity_log enable row level security;

create policy activity_log_select_own on activity_log
  for select using (auth.uid() = user_id);

-- Triggers populate activity_log
create or replace function log_like()
returns trigger language plpgsql security definer set search_path = public
as $$
declare author_uid uuid;
begin
  select author_id into author_uid from posts where id = new.post_id;
  if author_uid is null or author_uid = new.user_id then return new; end if;
  insert into activity_log (user_id, actor_id, kind, post_id)
    values (author_uid, new.user_id, 'like', new.post_id);
  return new;
end;
$$;

drop trigger if exists post_upvote_log on post_upvotes;
create trigger post_upvote_log after insert on post_upvotes
  for each row execute function log_like();

create or replace function log_comment()
returns trigger language plpgsql security definer set search_path = public
as $$
declare target_uid uuid;
begin
  if new.post_id is not null then
    select author_id into target_uid from posts where id = new.post_id;
  end if;
  if new.issue_id is not null then
    select creator_id into target_uid from issues where id = new.issue_id;
  end if;
  if target_uid is null or target_uid = new.author_id then return new; end if;
  insert into activity_log (user_id, actor_id, kind, post_id, comment_id, issue_id)
    values (target_uid, new.author_id, 'comment', new.post_id, new.id, new.issue_id);
  return new;
end;
$$;

drop trigger if exists comment_log on comments;
create trigger comment_log after insert on comments
  for each row execute function log_comment();

create or replace function log_follow()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into activity_log (user_id, actor_id, kind)
    values (new.followee_id, new.follower_id, 'follow');
  return new;
end;
$$;

drop trigger if exists user_follow_log on user_follows;
create trigger user_follow_log after insert on user_follows
  for each row execute function log_follow();

-- Settlement: log to all judging users; called from settle_judgments
create or replace function public.settle_judgments(p_issue_id uuid, p_result boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update judgments set is_correct = (stance = p_result) where issue_id = p_issue_id;
  update posts set verified_status = case when stance = p_result then 'correct' else 'wrong' end
    where issue_id = p_issue_id and stance is not null;
  -- Log activity for each judging user
  insert into activity_log (user_id, kind, issue_id, is_correct)
  select user_id, 'settle', p_issue_id, (stance = p_result)
  from judgments where issue_id = p_issue_id and counts_toward_rank;
end;
$$;

-- Issue approval: trigger logs to creator
create or replace function log_issue_review()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.creator_id is null then return new; end if;
  if old.review_status = 'pending' and new.review_status = 'approved' then
    insert into activity_log (user_id, kind, issue_id)
      values (new.creator_id, 'issue_approved', new.id);
  elsif old.review_status = 'pending' and new.review_status = 'rejected' then
    insert into activity_log (user_id, kind, issue_id)
      values (new.creator_id, 'issue_rejected', new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists issue_review_log on issues;
create trigger issue_review_log after update of review_status on issues
  for each row execute function log_issue_review();

-- ============================================================
-- 4. Admin stats view
-- ============================================================
create or replace view admin_stats as
select
  (select count(*) from profiles)::int as total_users,
  (select count(*) from profiles where joined_at > now() - interval '24 hours')::int as new_users_24h,
  (select count(*) from profiles where joined_at > now() - interval '7 days')::int as new_users_7d,
  (select count(*) from profiles where is_banned)::int as banned_users,
  (select count(*) from issues where review_status = 'approved')::int as total_issues,
  (select count(*) from issues where status = 'pending' and is_open and review_status = 'approved')::int as open_issues,
  (select count(*) from issues where review_status = 'pending')::int as pending_review,
  (select count(*) from issues where status in ('correct','wrong'))::int as settled_issues,
  (select count(*) from judgments)::int as total_judgments,
  (select count(*) from posts)::int as total_posts,
  (select count(*) from comments)::int as total_comments,
  (select count(*) from judgments where created_at > now() - interval '24 hours')::int as judgments_24h,
  (select count(*) from posts where created_at > now() - interval '24 hours')::int as posts_24h,
  (select count(*) from comments where created_at > now() - interval '24 hours')::int as comments_24h,
  (select count(*) from judgments where committed_at > now() - interval '24 hours' and counts_toward_rank)::int as ranked_judgments_24h,
  (select round(100.0 * count(*) filter (where is_correct = true) / nullif(count(*), 0))::int
     from judgments where is_correct is not null and counts_toward_rank) as overall_accuracy_pct;

-- ============================================================
-- 5. Bump rate_limits to also block guests via auth check (optional later)
-- ============================================================
-- Skipped — Cloudflare WAF in front of Pages already handles DDoS at edge.
