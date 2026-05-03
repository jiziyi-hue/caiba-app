-- Restrict admin_stats view: wrap in security definer RPC
-- Views don't support RLS; wrap so only admins can call it

create or replace function public.get_admin_stats()
returns setof admin_stats
language sql
security definer
set search_path = public
as $$
  select * from admin_stats
  where exists (select 1 from profiles where id = auth.uid() and is_admin = true);
$$;

revoke execute on function public.get_admin_stats() from public, anon;
grant execute on function public.get_admin_stats() to authenticated;

-- Revoke direct table access from anon/authenticated; keep service_role
revoke select on admin_stats from anon, authenticated;
