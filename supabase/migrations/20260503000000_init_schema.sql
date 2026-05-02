-- CaiBa initial schema
-- Tables: profiles, issues, judgments, posts, topics, user_follows, topic_follows, post_upvotes
-- Reference: GDD §4.1

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- profiles: business fields per auth.users
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  handle        text unique not null,
  name          text not null check (char_length(name) <= 16),
  bio           text check (char_length(bio) <= 60),
  avatar_url    text,
  avatar_tint   text default 'indigo' check (avatar_tint in ('indigo','warm','sage','rose')),
  joined_at     timestamptz default now(),
  is_admin      boolean default false,
  created_at    timestamptz default now()
);

-- issues: 4-phase lifecycle
create table issues (
  id                  uuid primary key default gen_random_uuid(),
  creator_id          uuid references profiles(id) on delete set null,
  category            text not null check (category in ('时事','科技','娱乐','体育')),
  title               text not null,
  description         text,
  thumbnail_url       text,
  total_pct_cache     int default 0,
  total_count_cache   int default 0,
  ranked_count_cache  int default 0,
  status              text not null default 'pending' check (status in ('pending','correct','wrong','cancelled')),
  created_at          timestamptz not null default now(),
  opens_at            timestamptz not null,
  closes_at           timestamptz not null,
  deadline            timestamptz not null,
  settled_at          timestamptz,
  settled_by          uuid references profiles(id) on delete set null,
  settlement_source   text,
  settlement_note     text,
  check (created_at < opens_at and opens_at < closes_at and closes_at <= deadline)
);

create index issues_status_deadline_idx on issues (status, deadline);
create index issues_category_idx on issues (category);

-- judgments: per-user-per-issue stance
create table judgments (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references profiles(id) on delete cascade,
  issue_id              uuid not null references issues(id) on delete cascade,
  stance                boolean not null,
  committed_at          timestamptz not null default now(),
  change_count          int not null default 0,
  first_committed_at    timestamptz not null default now(),
  counts_toward_rank    boolean not null,
  is_correct            boolean,
  created_at            timestamptz not null default now(),
  unique(user_id, issue_id)
);

create index judgments_user_idx on judgments (user_id);
create index judgments_issue_idx on judgments (issue_id);
create index judgments_correct_rank_idx on judgments (is_correct, counts_toward_rank) where is_correct is not null;

-- topics
create table topics (
  id                uuid primary key default gen_random_uuid(),
  name              text unique not null,
  description       text,
  category          text check (category in ('时事','科技','娱乐','体育')),
  cover_url         text,
  linked_issue_id   uuid references issues(id) on delete set null,
  heat              int default 0,
  participants      int default 0,
  created_at        timestamptz default now()
);

-- posts (forum)
create table posts (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid not null references profiles(id) on delete cascade,
  title           text not null,
  content         jsonb not null,
  issue_id        uuid references issues(id) on delete set null,
  stance          boolean,
  topic_id        uuid references topics(id) on delete set null,
  upvotes         int default 0,
  comment_count   int default 0,
  verified_status text check (verified_status in ('correct','wrong')),
  created_at      timestamptz default now()
);

create index posts_author_idx on posts (author_id);
create index posts_issue_idx on posts (issue_id);
create index posts_topic_idx on posts (topic_id);

-- follows
create table user_follows (
  follower_id   uuid references profiles(id) on delete cascade,
  followee_id   uuid references profiles(id) on delete cascade,
  created_at    timestamptz default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create table topic_follows (
  user_id     uuid references profiles(id) on delete cascade,
  topic_id    uuid references topics(id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (user_id, topic_id)
);

-- post upvotes (anti-spam)
create table post_upvotes (
  user_id     uuid references profiles(id) on delete cascade,
  post_id     uuid references posts(id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (user_id, post_id)
);

-- Auto-create profile on auth signup
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_handle text;
begin
  -- Auto-generate handle from email if not provided in user_metadata
  new_handle := coalesce(
    new.raw_user_meta_data->>'handle',
    split_part(new.email, '@', 1) || '-' || substr(replace(new.id::text, '-', ''), 1, 6)
  );

  insert into public.profiles (id, handle, name)
  values (
    new.id,
    new_handle,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
