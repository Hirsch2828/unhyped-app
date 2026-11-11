-- Anonymous click counter for "Most clicked this week".
-- Stores only which story was opened and when: no user id, no IP, no device data.
create table if not exists public.story_views (
  id        bigint generated always as identity primary key,
  story_id  uuid not null references public.stories(id) on delete cascade,
  viewed_at timestamptz not null default now()
);
create index if not exists story_views_time_idx on public.story_views (viewed_at);
create index if not exists story_views_story_idx on public.story_views (story_id);

-- No policies: nobody reads or writes the table directly. The two functions below are the only way in.
alter table public.story_views enable row level security;

-- Count one open of a published story.
create or replace function public.record_view(p_story uuid) returns void
language sql security definer set search_path = '' as $$
  insert into public.story_views (story_id)
  select id from public.stories where id = p_story and status = 'published';
$$;

-- Top 50 most opened stories of the last N days (max 30).
create or replace function public.most_clicked(p_days int default 7)
returns table (story_id uuid, clicks bigint)
language sql stable security definer set search_path = '' as $$
  select v.story_id, count(*) as clicks
  from public.story_views v
  where v.viewed_at > now() - make_interval(days => least(greatest(p_days, 1), 30))
  group by v.story_id
  order by clicks desc
  limit 50;
$$;

revoke execute on function public.record_view(uuid) from public;
revoke execute on function public.most_clicked(int) from public;
grant execute on function public.record_view(uuid) to anon, authenticated;
grant execute on function public.most_clicked(int) to anon, authenticated;
