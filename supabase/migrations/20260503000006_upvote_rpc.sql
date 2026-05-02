-- toggle_upvote: atomically insert/delete post_upvote + update posts.upvotes count
-- Bypasses posts UPDATE RLS (which only allows author within 24h)

create or replace function toggle_upvote(p_post_id uuid)
returns table(upvoted boolean, count int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_existing boolean;
  v_count int;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'must be authenticated';
  end if;

  -- Check existing
  select exists (
    select 1 from post_upvotes
    where post_id = p_post_id and user_id = v_user_id
  ) into v_existing;

  if v_existing then
    delete from post_upvotes where post_id = p_post_id and user_id = v_user_id;
  else
    insert into post_upvotes (post_id, user_id) values (p_post_id, v_user_id);
  end if;

  -- Recompute and store
  update posts
    set upvotes = (select count(*) from post_upvotes where post_id = p_post_id)
    where id = p_post_id
    returning upvotes into v_count;

  return query select (not v_existing) as upvoted, coalesce(v_count, 0) as count;
end;
$$;

revoke all on function toggle_upvote(uuid) from public;
grant execute on function toggle_upvote(uuid) to authenticated;
