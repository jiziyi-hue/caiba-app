-- Storage RLS: each user can only write into folders that match their auth.uid()
-- Public read on all 3 buckets remains (set when bucket was created)

-- avatars: owner can write file named "<uid>.<ext>" (single file)
create policy "avatars_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    or split_part(name, '.', 1) = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (split_part(name, '.', 1) = auth.uid()::text or (storage.foldername(name))[1] = auth.uid()::text)
  );

create policy "avatars_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (split_part(name, '.', 1) = auth.uid()::text or (storage.foldername(name))[1] = auth.uid()::text)
  );

-- posts: writes go under "<uid>/..."
create policy "posts_insert_own_folder"
  on storage.objects for insert
  with check (
    bucket_id = 'posts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "posts_update_own_folder"
  on storage.objects for update
  using (
    bucket_id = 'posts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "posts_delete_own_folder"
  on storage.objects for delete
  using (
    bucket_id = 'posts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- issue-thumbs: admin only
create policy "issue_thumbs_admin_write"
  on storage.objects for insert
  with check (
    bucket_id = 'issue-thumbs'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "issue_thumbs_admin_update"
  on storage.objects for update
  using (
    bucket_id = 'issue-thumbs'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "issue_thumbs_admin_delete"
  on storage.objects for delete
  using (
    bucket_id = 'issue-thumbs'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
