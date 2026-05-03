-- Maintenance jobs: activity_log TTL cleanup + topics heat trigger

-- ============================================================
-- 1. activity_log cleanup function (call manually or via pg_cron)
-- Enable pg_cron in Supabase Dashboard → Database → Extensions
-- Then run: select cron.schedule('cleanup_activity_log', '0 3 * * *',
--   'select cleanup_activity_log()');
-- ============================================================
create or replace function public.cleanup_activity_log()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare deleted int;
begin
  delete from activity_log where created_at < now() - interval '30 days';
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;
revoke execute on function public.cleanup_activity_log() from public, anon;
grant execute on function public.cleanup_activity_log() to authenticated;

-- ============================================================
-- 2. topics heat + participants auto-update
-- Updates when posts inserted/deleted on a topic
-- ============================================================
create or replace function update_topic_heat()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t_id uuid;
  new_heat int;
  new_participants int;
begin
  t_id := coalesce(new.topic_id, old.topic_id);
  if t_id is null then return coalesce(new, old); end if;

  select
    coalesce(sum(upvotes), 0) + count(*) * 2,
    count(distinct author_id)
  into new_heat, new_participants
  from posts
  where topic_id = t_id;

  update topics set
    heat = new_heat,
    participants = new_participants
  where id = t_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists posts_update_topic_heat on posts;
create trigger posts_update_topic_heat
  after insert or delete on posts
  for each row execute function update_topic_heat();

-- Also update heat when post upvotes change
create or replace function update_topic_heat_on_upvote()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t_id uuid;
begin
  select topic_id into t_id from posts where id = coalesce(new.post_id, old.post_id);
  if t_id is null then return coalesce(new, old); end if;

  update topics set
    heat = (select coalesce(sum(upvotes), 0) + count(*) * 2 from posts where topic_id = t_id)
  where id = t_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists upvotes_update_topic_heat on post_upvotes;
create trigger upvotes_update_topic_heat
  after insert or delete on post_upvotes
  for each row execute function update_topic_heat_on_upvote();
