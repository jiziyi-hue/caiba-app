-- RLS policies
-- Reference: GDD §4.3 + Appendix B

-- profiles
alter table profiles enable row level security;

create policy "profiles_select_all" on profiles
  for select using (true);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and is_admin = (select is_admin from profiles where id = auth.uid()));

-- INSERT handled by handle_new_user trigger (security definer); no client INSERT.

-- issues
alter table issues enable row level security;

create policy "issues_select_all" on issues
  for select using (true);

create policy "issues_admin_all" on issues
  for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- judgments
alter table judgments enable row level security;

create policy "judgments_select_all" on judgments
  for select using (true);

create policy "judgments_insert_own" on judgments
  for insert with check (auth.uid() = user_id);

create policy "judgments_update_own" on judgments
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE: not allowed for users (no policy = blocked).
-- Service-role bypasses RLS so settle endpoint can update is_correct freely.

-- topics
alter table topics enable row level security;

create policy "topics_select_all" on topics
  for select using (true);

create policy "topics_admin_all" on topics
  for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- posts
alter table posts enable row level security;

create policy "posts_select_all" on posts
  for select using (true);

create policy "posts_insert_own" on posts
  for insert with check (auth.uid() = author_id);

create policy "posts_update_own_24h" on posts
  for update using (
    auth.uid() = author_id
    and created_at > now() - interval '24 hours'
  );

create policy "posts_delete_own_24h" on posts
  for delete using (
    auth.uid() = author_id
    and created_at > now() - interval '24 hours'
  );

-- user_follows
alter table user_follows enable row level security;

create policy "user_follows_select_all" on user_follows
  for select using (true);

create policy "user_follows_insert_own" on user_follows
  for insert with check (auth.uid() = follower_id);

create policy "user_follows_delete_own" on user_follows
  for delete using (auth.uid() = follower_id);

-- topic_follows
alter table topic_follows enable row level security;

create policy "topic_follows_select_all" on topic_follows
  for select using (true);

create policy "topic_follows_insert_own" on topic_follows
  for insert with check (auth.uid() = user_id);

create policy "topic_follows_delete_own" on topic_follows
  for delete using (auth.uid() = user_id);

-- post_upvotes
alter table post_upvotes enable row level security;

create policy "post_upvotes_select_all" on post_upvotes
  for select using (true);

create policy "post_upvotes_insert_own" on post_upvotes
  for insert with check (auth.uid() = user_id);

create policy "post_upvotes_delete_own" on post_upvotes
  for delete using (auth.uid() = user_id);
