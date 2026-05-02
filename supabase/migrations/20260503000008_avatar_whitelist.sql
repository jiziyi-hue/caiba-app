-- Layer 1: Avatar URL whitelist — must come from our public storage
-- Layer 3: Storage SVG ban for non-admin (admin can still upload SVG for system avatars)

-- profile.avatar_url whitelist
alter table profiles add constraint avatar_url_whitelist check (
  avatar_url is null
  or avatar_url like 'https://qfaqptcnutzciapaeqth.supabase.co/storage/v1/object/public/avatars/%'
);

-- Replace permissive insert policy with raster-only (admin exempt)
drop policy if exists "avatars_insert_own" on storage.objects;

create policy "avatars_insert_strict"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (split_part(name, '.', 1) = auth.uid()::text
         or (storage.foldername(name))[1] = auth.uid()::text)
    and (
      lower(storage.extension(name)) in ('jpg','jpeg','png','webp','gif')
      or exists (
        select 1 from public.profiles where id = auth.uid() and is_admin = true
      )
    )
  );
