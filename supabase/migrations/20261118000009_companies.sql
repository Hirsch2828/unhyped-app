-- Milestone 5g: company teardown facts, reviewed by an editor before they reach the site.
-- The site shows approved rows; until a company is approved it falls back to the drafts in src/data/companies.ts.
create table public.companies (
  id          text primary key,
  name        text not null,
  line        text not null,
  unit        text not null,
  form        text not null check (form in ('machine', 'gpu', 'car', 'phone')),
  match       text[] not null default '{}',
  source_label text not null,
  source_url  text not null,
  status      text not null default 'draft' check (status in ('draft', 'approved')),
  approved_at timestamptz,
  updated_at  timestamptz not null default now()
);

create table public.company_parts (
  company_id text not null references public.companies(id) on delete cascade,
  id         text not null,
  position   int  not null,
  name       text not null,
  kind       text check (kind in ('gate', 'rack', 'scanner', 'dock', 'cluster', 'devices')),
  match      text[] not null default '{}',
  role       text not null,
  what       text not null,
  primary key (company_id, id)
);

alter table public.companies     enable row level security;
alter table public.company_parts enable row level security;

-- Readers see approved companies only; editors see and change everything.
create policy "read approved companies" on public.companies for select
  using (status = 'approved' or public.is_editor());
create policy "read parts of approved companies" on public.company_parts for select
  using (exists (select 1 from public.companies c where c.id = company_id and (c.status = 'approved' or public.is_editor())));
create policy "editors manage companies" on public.companies for all
  using (public.is_editor()) with check (public.is_editor());
create policy "editors manage company parts" on public.company_parts for all
  using (public.is_editor()) with check (public.is_editor());
