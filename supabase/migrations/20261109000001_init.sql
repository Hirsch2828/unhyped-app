-- Unhyped: initial schema
-- Topics at launch: ai, tesla. Labels are set by rule from the strongest source tier.


-- ---------- Sources ----------
create table public.sources (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  url           text not null unique,           -- RSS / Atom feed URL
  site_url      text,
  tier          text not null check (tier in ('official','news','signal')),
  topic         text not null check (topic in ('ai','tesla')),
  active        boolean not null default true,
  last_fetched_at timestamptz,
  last_error    text,
  created_at    timestamptz not null default now()
);

-- ---------- Image library (our own images) ----------
create table public.images (
  id         uuid primary key default gen_random_uuid(),
  path       text not null,                     -- path in storage bucket "images", or full URL
  topic      text not null check (topic in ('ai','tesla')),
  tags       text[] not null default '{}',      -- e.g. {agents, models, policy, vehicles, fsd}
  alt        text not null default '',
  created_at timestamptz not null default now()
);

-- ---------- Stories (one card per real-world event) ----------
create table public.stories (
  id              uuid primary key default gen_random_uuid(),
  topic           text not null check (topic in ('ai','tesla')),
  area            text,                          -- sub-area tag, e.g. agents, vehicles
  label           text not null default 'rumor' check (label in ('official','report','rumor')),
  importance      int  not null default 1 check (importance between 1 and 3),
  status          text not null default 'draft' check (status in ('draft','pending_review','published','rejected')),
  title           text not null,
  dek             text not null default '',
  takeaways       jsonb not null default '[]',
  why_it_matters  text not null default '',
  what_happened   text not null default '',
  market_reaction text,
  claims          jsonb not null default '[]',   -- [{text, article_ids:[]}]
  change_note     text,                          -- e.g. "Now confirmed by Tesla"
  image_id        uuid references public.images(id) on delete set null,
  article_count   int not null default 0,
  needs_rewrite   boolean not null default true, -- set when new articles join
  first_seen_at   timestamptz not null default now(),
  last_article_at timestamptz not null default now(),
  published_at    timestamptz,
  updated_at      timestamptz not null default now()
);
create index stories_feed_idx on public.stories (status, last_article_at desc);

-- ---------- Articles (raw items from sources) ----------
create table public.articles (
  id           uuid primary key default gen_random_uuid(),
  source_id    uuid not null references public.sources(id) on delete cascade,
  url          text not null unique,
  title        text not null,
  summary      text not null default '',
  published_at timestamptz,
  fetched_at   timestamptz not null default now(),
  topic        text not null check (topic in ('ai','tesla')),
  story_id     uuid references public.stories(id) on delete set null,
  processed_at timestamptz
);
create index articles_unprocessed_idx on public.articles (processed_at) where processed_at is null;
create index articles_story_idx on public.articles (story_id);

-- ---------- Daily brief ----------
create table public.briefs (
  id         uuid primary key default gen_random_uuid(),
  brief_date date not null unique,
  story_ids  uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------- Users ----------
create table public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  topics     text[] not null default '{ai}',
  depth      text not null default 'balanced' check (depth in ('essentials','balanced','everything')),
  brief_time time not null default '08:00',
  timezone   text not null default 'UTC',
  reminder   boolean not null default true,
  email_brief boolean not null default false,
  role       text not null default 'user' check (role in ('user','editor')),
  created_at timestamptz not null default now()
);

create table public.saved (
  user_id    uuid not null references auth.users(id) on delete cascade,
  story_id   uuid not null references public.stories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, story_id)
);

-- Create a profile row on sign-up
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_editor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where user_id = auth.uid() and role = 'editor');
$$;

-- ---------- Row level security ----------
alter table public.sources  enable row level security;
alter table public.images   enable row level security;
alter table public.stories  enable row level security;
alter table public.articles enable row level security;
alter table public.briefs   enable row level security;
alter table public.profiles enable row level security;
alter table public.saved    enable row level security;

-- Public (anon) can read what the app shows
create policy "read sources"  on public.sources  for select using (true);
create policy "read images"   on public.images   for select using (true);
create policy "read briefs"   on public.briefs   for select using (true);
create policy "read published stories" on public.stories for select
  using (status = 'published' or public.is_editor());
create policy "read articles of published stories" on public.articles for select
  using (exists (select 1 from public.stories s where s.id = story_id and (s.status = 'published' or public.is_editor())));

-- Editors review and edit stories
create policy "editors update stories" on public.stories for update
  using (public.is_editor()) with check (public.is_editor());
create policy "editors manage images" on public.images for all
  using (public.is_editor()) with check (public.is_editor());
create policy "editors manage sources" on public.sources for all
  using (public.is_editor()) with check (public.is_editor());

-- Users manage their own rows (role cannot be changed by the user)
create policy "own profile read"   on public.profiles for select using (user_id = auth.uid());
create policy "own profile update" on public.profiles for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Users cannot promote themselves to editor (only the service role / dashboard can).
create or replace function public.guard_role() returns trigger
language plpgsql as $$
begin
  if new.role is distinct from old.role and current_user in ('authenticated', 'anon') then
    raise exception 'role cannot be changed by the user';
  end if;
  return new;
end $$;
create trigger profiles_guard_role before update on public.profiles
  for each row execute function public.guard_role();
create policy "own saved" on public.saved for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Edge functions use the service role key and bypass RLS.
