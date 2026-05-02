-- Comments table for posts and issues
-- Anyone can read; authenticated users can post/edit own; admins can moderate

create table comments (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references profiles(id) on delete cascade,
  -- Either post_id or issue_id is set (not both, not neither)
  post_id     uuid references posts(id) on delete cascade,
  issue_id    uuid references issues(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 1000),
  created_at  timestamptz default now(),
  check ((post_id is not null) <> (issue_id is not null))
);

create index comments_post_idx on comments (post_id, created_at desc) where post_id is not null;
create index comments_issue_idx on comments (issue_id, created_at desc) where issue_id is not null;
create index comments_author_idx on comments (author_id);

alter table comments enable row level security;

create policy "comments_select_all" on comments
  for select using (true);

create policy "comments_insert_own" on comments
  for insert with check (auth.uid() = author_id);

create policy "comments_update_own_24h" on comments
  for update using (
    auth.uid() = author_id
    and created_at > now() - interval '24 hours'
  );

create policy "comments_delete_own_or_admin" on comments
  for delete using (
    auth.uid() = author_id
    or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- Auto-increment posts.comment_count when comment is added/removed
create or replace function update_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.post_id is not null then
    update posts set comment_count = coalesce(comment_count, 0) + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' and old.post_id is not null then
    update posts set comment_count = greatest(coalesce(comment_count, 0) - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

create trigger comments_count_on_insert
  after insert on comments
  for each row execute function update_post_comment_count();

create trigger comments_count_on_delete
  after delete on comments
  for each row execute function update_post_comment_count();
