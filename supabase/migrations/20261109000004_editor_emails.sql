-- Editors: emails listed in private.config 'editor_emails' (comma separated) get role 'editor' on sign-up.
insert into private.config (key, value) values ('editor_emails', 'hirschori2007@gmail.com')
  on conflict (key) do update set value = excluded.value;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare editors text;
begin
  select value into editors from private.config where key = 'editor_emails';
  insert into public.profiles (user_id, role)
  values (new.id, case when lower(new.email) = any (string_to_array(lower(coalesce(editors, '')), ',')) then 'editor' else 'user' end)
  on conflict do nothing;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
