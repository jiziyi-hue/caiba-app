-- Security fixes:
-- 1. Prevent creator from judging their own issue
-- 2. Restrict user_notifications view + replace with security definer function
-- 3. Add post rate limit

-- ============================================================
-- Fix 1: Prevent creator from judging their own issue
-- ============================================================
create or replace function public.enforce_judgment_phase()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  iss issues%rowtype;
begin
  select * into iss from issues where id = new.issue_id;
  if not found then
    raise exception '议题不存在';
  end if;

  if (tg_op = 'INSERT') then
    new.first_committed_at := now();
    new.committed_at := now();
    new.change_count := 0;
    if iss.status <> 'pending' then
      raise exception '议题已结算，无法表态';
    end if;
    if not iss.is_open then
      raise exception '判断期已关闭';
    end if;
    -- Block creator from judging their own issue
    if iss.creator_id is not null and new.user_id = iss.creator_id then
      raise exception '不能给自己创建的议题表态';
    end if;
    -- All open-period judgments count toward rank
    new.counts_toward_rank := true;

  elsif (tg_op = 'UPDATE') then
    if iss.status <> 'pending' then
      raise exception '议题已结算，无法修改';
    end if;
    if not iss.is_open then
      raise exception '判断期已关闭，立场已锁定';
    end if;
    -- Lock immutable fields
    new.first_committed_at := old.first_committed_at;
    new.counts_toward_rank := old.counts_toward_rank;
    if new.stance is distinct from old.stance then
      new.change_count := old.change_count + 1;
      new.committed_at := now();
    else
      new.committed_at := old.committed_at;
      new.change_count := old.change_count;
    end if;
  end if;

  return new;
end;
$$;

-- ============================================================
-- Fix 2: Restrict user_notifications view
-- ============================================================
revoke select on user_notifications from anon, authenticated;

create or replace function public.get_my_notifications()
returns setof user_notifications
language sql
security definer
set search_path = public
as $$
  select * from user_notifications where user_id = auth.uid();
$$;
revoke execute on function public.get_my_notifications() from public, anon;
grant execute on function public.get_my_notifications() to authenticated;

-- ============================================================
-- Fix 3: Add post rate limit
-- ============================================================
create or replace function rate_limit_posts()
returns trigger language plpgsql security definer set search_path = public
as $$
declare cnt int;
begin
  select count(*) into cnt from posts
    where author_id = new.author_id
      and created_at > now() - interval '1 hour';
  if cnt >= 10 then
    raise exception '发帖太频繁，每小时最多10条';
  end if;
  return new;
end;
$$;
drop trigger if exists posts_rate_limit on posts;
create trigger posts_rate_limit before insert on posts
  for each row execute function rate_limit_posts();
