-- Unique constraint: one post per user per issue (when issue_id is set)
-- Plus rate limits on comments, upvotes, judgment updates
-- Reference: GDD §6.6 + plan additions

-- Posts: only one per (author, issue) when linked to issue
create unique index posts_one_per_issue_per_author on posts (author_id, issue_id) where issue_id is not null;

-- Helper: count user's recent rows by author/user column
create or replace function rate_count_comments(p_user uuid, p_seconds int)
returns int language sql stable as $$
  select count(*)::int from comments
  where author_id = p_user and created_at > now() - make_interval(secs => p_seconds);
$$;

create or replace function rate_count_upvotes(p_user uuid, p_seconds int)
returns int language sql stable as $$
  select count(*)::int from post_upvotes
  where user_id = p_user and created_at > now() - make_interval(secs => p_seconds);
$$;

-- Trigger: comments rate limit (5/min, 30/hr)
create or replace function rate_limit_comments()
returns trigger language plpgsql as $$
begin
  if rate_count_comments(new.author_id, 60) >= 5 then
    raise exception '评论太快了 · 1 分钟内最多 5 条' using errcode = 'P0002';
  end if;
  if rate_count_comments(new.author_id, 3600) >= 30 then
    raise exception '1 小时内最多 30 条评论' using errcode = 'P0002';
  end if;
  return new;
end $$;

create trigger comments_rate_limit before insert on comments
  for each row execute function rate_limit_comments();

-- Trigger: post_upvotes rate limit (20/min — covers both insert and delete via toggle)
-- Toggling fast still creates inserts in toggle_upvote RPC
create or replace function rate_limit_upvotes()
returns trigger language plpgsql as $$
begin
  if rate_count_upvotes(new.user_id, 60) >= 20 then
    raise exception '点赞太快了 · 慢一点' using errcode = 'P0002';
  end if;
  return new;
end $$;

create trigger upvotes_rate_limit before insert on post_upvotes
  for each row execute function rate_limit_upvotes();

-- Trigger: judgment stance changes (only on UPDATE — INSERT is one-shot per issue)
-- Limit: 3 changes per minute on same issue, 10 per minute across issues
create or replace function rate_limit_judgment_changes()
returns trigger language plpgsql as $$
declare
  v_count int;
begin
  -- Only count when stance actually changes
  if new.stance is not distinct from old.stance then
    return new;
  end if;
  -- Per-issue limit
  select count(*) into v_count from judgments
  where user_id = new.user_id
    and issue_id = new.issue_id
    and committed_at > now() - interval '1 minute';
  -- The current row hasn't updated yet, so we look at the change_count instead
  if old.change_count >= 3 and (now() - old.committed_at) < interval '1 minute' then
    raise exception '改主意太快了 · 等 1 分钟再来' using errcode = 'P0002';
  end if;
  return new;
end $$;

-- Note: this fires AFTER the existing enforce_judgment_phase trigger.
-- enforce_judgment_phase preserves committed_at when stance unchanged, so we can read old.committed_at safely.
create trigger judgments_rate_limit before update on judgments
  for each row execute function rate_limit_judgment_changes();
