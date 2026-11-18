-- Milestone 5c: fields for the signature moments (hype vs reality, highlighter, open questions, source comparison).
alter table public.stories
  add column if not exists hype_title   text,   -- a real source headline, copied verbatim; null when every headline is calm
  add column if not exists hype_source  text,   -- which source used it (kept for checking, not shown in the app)
  add column if not exists highlight    text,   -- the phrase in our title that carries the news (always a substring of title)
  add column if not exists uncertain    jsonb not null default '[]'::jsonb, -- open questions the articles themselves raise
  add column if not exists source_notes jsonb not null default '[]'::jsonb, -- [{source, stance: agrees|adds|differs, note}]
  add column if not exists enriched_at  timestamptz;
create index if not exists stories_enrich_idx on public.stories (enriched_at) where enriched_at is null;
