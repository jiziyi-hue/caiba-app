-- Admin operations + user ban + notification aggregates

-- ============================================================
-- 1. User ban
-- ============================================================
alter table profiles add column if not exists is_banned boolean not null default false;

-- Block banned users from creating content
drop policy if exists posts_insert_own on posts;
create policy posts_insert_own on posts
  for insert with check (
    auth.uid() = author_id
    and not exists (select 1 from profiles where id = auth.uid() and is_banned = true)
  );

drop policy if exists comments_insert_own on comments;
create policy comments_insert_own on comments
  for insert with check (
    auth.uid() = author_id
    and not exists (select 1 from profiles where id = auth.uid() and is_banned = true)
  );

drop policy if exists judgments_insert_own on judgments;
create policy judgments_insert_own on judgments
  for insert with check (
    auth.uid() = user_id
    and not exists (select 1 from profiles where id = auth.uid() and is_banned = true)
  );

-- ============================================================
-- 2. Admin DELETE on posts (overrides 24h limit)
-- ============================================================
create policy posts_delete_admin on posts
  for delete using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- comments admin delete already exists in migration 5

-- ============================================================
-- 3. Admin UPDATE on profiles (for is_banned, avatar clear)
-- ============================================================
create policy profiles_admin_update on profiles
  for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- ============================================================
-- 4. Unsettle RPC (admin reverts settlement)
-- ============================================================
create or replace function public.unsettle_issue(p_issue_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin = true) then
    raise exception '需要管理员权限';
  end if;
  update issues set
    status = 'pending',
    is_open = false,
    settled_at = null,
    settled_by = null,
    settlement_source = null,
    settlement_note = null
  where id = p_issue_id;
  update judgments set is_correct = null where issue_id = p_issue_id;
  update posts set verified_status = null
    where issue_id = p_issue_id and verified_status is not null;
end;
$$;
revoke execute on function public.unsettle_issue(uuid) from public, anon;
grant execute on function public.unsettle_issue(uuid) to authenticated;

-- ============================================================
-- 5. Notification aggregates
-- ============================================================
alter table profiles add column if not exists notifications_seen_at timestamptz not null default now();

-- View: per-user totals + new-since-last-seen deltas
create or replace view user_notifications as
select
  p.id as user_id,
  p.notifications_seen_at,
  -- New since last seen
  (select count(*)::int from post_upvotes pu
     join posts po on po.id = pu.post_id
     where po.author_id = p.id
       and pu.user_id <> p.id
       and pu.created_at > p.notifications_seen_at) as new_likes,
  (select count(*)::int from comments c
     left join posts po on po.id = c.post_id
     where (po.author_id = p.id or c.issue_id in (select issue_id from judgments where user_id = p.id))
       and c.author_id <> p.id
       and c.created_at > p.notifications_seen_at) as new_comments,
  (select count(*)::int from user_follows uf
     where uf.followee_id = p.id
       and uf.created_at > p.notifications_seen_at) as new_followers,
  (select count(*)::int from judgments j
     join issues i on i.id = j.issue_id
     where j.user_id = p.id
       and j.is_correct is not null
       and j.counts_toward_rank
       and i.settled_at is not null
       and i.settled_at > p.notifications_seen_at) as new_settlements,
  -- Lifetime totals
  (select coalesce(sum(upvotes),0)::int from posts where author_id = p.id) as total_likes,
  (select coalesce(sum(comment_count),0)::int from posts where author_id = p.id) as total_post_comments,
  (select count(*)::int from user_follows where followee_id = p.id) as total_followers,
  (select count(*)::int from judgments j
     where j.user_id = p.id and j.is_correct = true and j.counts_toward_rank) as total_correct
from profiles p;

-- Mark notifications seen RPC
create or replace function public.mark_notifications_seen()
returns void
language sql
security definer
set search_path = public
as $$
  update profiles set notifications_seen_at = now() where id = auth.uid();
$$;
revoke execute on function public.mark_notifications_seen() from public, anon;
grant execute on function public.mark_notifications_seen() to authenticated;
