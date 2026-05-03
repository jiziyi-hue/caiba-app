-- Hard account deletion: delete from auth.users, cascade through all FKs.
-- profiles.id -> auth.users ON DELETE CASCADE drops the profile, which then
-- cascades through judgments / posts / comments / follows / upvotes /
-- activity_log. issues.creator_id / settled_by are ON DELETE SET NULL by
-- design (preserve content integrity).

-- banned_words.added_by has no ON DELETE clause; relax it so that deleting
-- an admin user (rare but possible) does not block the cascade.
alter table banned_words drop constraint if exists banned_words_added_by_fkey;
alter table banned_words
  add constraint banned_words_added_by_fkey
  foreign key (added_by) references profiles(id) on delete set null;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid;
begin
  uid := auth.uid();
  if uid is null then
    raise exception '未登录';
  end if;

  -- Delete from auth.users — cascades through profile FK
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
