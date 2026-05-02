-- Banned words + content moderation trigger
-- Auto-reject INSERT on posts/comments/profiles if content matches banned list
-- Admin can manage list via SQL or future /admin/moderation UI

create table banned_words (
  id          uuid primary key default gen_random_uuid(),
  word        text unique not null,
  category    text check (category in ('terror', 'explosive', 'porn', 'political', 'other')),
  added_at    timestamptz default now(),
  added_by    uuid references profiles(id)
);

alter table banned_words enable row level security;

-- Anyone can read (for client-side hint / pre-validate)
create policy "banned_words_select_all" on banned_words for select using (true);
-- Only admin can write
create policy "banned_words_admin_write" on banned_words for all using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- Seed: starter list (very small, expand via UI/SQL later)
insert into banned_words (word, category) values
  -- 涉恐
  ('恐怖袭击', 'terror'),
  ('自杀式袭击', 'terror'),
  ('ISIS', 'terror'),
  ('基地组织', 'terror'),
  ('恐怖分子', 'terror'),
  ('斩首', 'terror'),
  -- 涉爆
  ('制造炸弹', 'explosive'),
  ('TNT', 'explosive'),
  ('雷管', 'explosive'),
  ('黑火药', 'explosive'),
  ('引爆装置', 'explosive'),
  ('炸药配方', 'explosive'),
  -- 涉黄
  ('约炮', 'porn'),
  ('做爱', 'porn'),
  ('裸聊', 'porn'),
  ('一夜情', 'porn'),
  ('AV番号', 'porn'),
  ('色情网站', 'porn'),
  -- 涉政（保守起步，按需增减）
  ('翻墙', 'political'),
  ('VPN', 'political')
on conflict do nothing;

-- Function: case-insensitive substring scan
create or replace function check_banned_words(text_to_check text)
returns text -- returns matched word or null
language sql
stable
security definer
set search_path = public
as $$
  select word from banned_words
  where text_to_check ilike '%' || word || '%'
  limit 1;
$$;

-- Trigger function for posts
create or replace function moderate_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match text;
  v_text  text;
begin
  v_text := new.title;
  -- Concat all text blocks from content jsonb
  if jsonb_typeof(new.content) = 'array' then
    v_text := v_text || ' ' || coalesce((
      select string_agg(b->>'value', ' ')
      from jsonb_array_elements(new.content) as b
      where b->>'type' = 'text'
    ), '');
  end if;
  v_match := check_banned_words(v_text);
  if v_match is not null then
    raise exception '内容含违规词「%»，无法发布', v_match using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger posts_moderate
  before insert or update on posts
  for each row execute function moderate_post();

-- Trigger function for comments
create or replace function moderate_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match text;
begin
  v_match := check_banned_words(new.body);
  if v_match is not null then
    raise exception '评论含违规词「%»，无法发送', v_match using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger comments_moderate
  before insert or update on comments
  for each row execute function moderate_comment();

-- Trigger function for profile (name + bio)
create or replace function moderate_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match text;
  v_text  text;
begin
  v_text := coalesce(new.name, '') || ' ' || coalesce(new.bio, '') || ' ' || coalesce(new.handle, '');
  v_match := check_banned_words(v_text);
  if v_match is not null then
    raise exception '资料含违规词「%»，无法保存', v_match using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger profiles_moderate
  before insert or update on profiles
  for each row execute function moderate_profile();
