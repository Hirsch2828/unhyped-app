-- Hardening + scheduled jobs (applied to project wzttcpnjnhsdhpcdqfhz on 2026-11-09).
create index if not exists stories_image_idx on public.stories (image_id);
create index if not exists articles_source_idx on public.articles (source_id);
create index if not exists saved_story_idx on public.saved (story_id);
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Shared secret for cron -> edge function calls. Never exposed through the API.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.config (key text primary key, value text not null);
insert into private.config (key, value)
  values ('cron_secret', encode(extensions.gen_random_bytes(24), 'hex'))
  on conflict do nothing;

create or replace function public.check_cron_secret(s text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from private.config where key = 'cron_secret' and value = s);
$$;
revoke execute on function public.check_cron_secret(text) from public, anon, authenticated;
grant execute on function public.check_cron_secret(text) to service_role;

-- Replace the project ref if you deploy to another project.
create or replace function private.call_function(fn text) returns bigint
language sql security definer set search_path = '' as $$
  select net.http_post(
    url := 'https://wzttcpnjnhsdhpcdqfhz.supabase.co/functions/v1/' || fn,
    headers := jsonb_build_object('Content-Type','application/json',
      'Authorization','Bearer ' || (select value from private.config where key = 'cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 150000);
$$;
revoke execute on function private.call_function(text) from public, anon, authenticated;

select cron.schedule('unhyped-ingest', '*/15 * * * *', $$select private.call_function('ingest')$$);
select cron.schedule('unhyped-process', '5,35 * * * *', $$select private.call_function('process')$$);
select cron.schedule('unhyped-brief', '0 5 * * *', $$select private.call_function('build-brief')$$);

update public.sources set active = false, last_error = 'disabled: feed URL broken (410/404), needs a new URL'
  where name in ('Microsoft AI Blog', 'Tesla Investor Relations');
