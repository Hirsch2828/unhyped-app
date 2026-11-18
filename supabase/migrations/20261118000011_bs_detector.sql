-- Milestone 5h: the fuller story, the Hype vs Reality meter, Debunked, stock prices, and Nvidia as a topic.

-- Nvidia and the chip market become a third topic.
alter table public.sources  drop constraint sources_topic_check,  add constraint sources_topic_check  check (topic in ('ai', 'tesla', 'nvidia'));
alter table public.images   drop constraint images_topic_check,   add constraint images_topic_check   check (topic in ('ai', 'tesla', 'nvidia'));
alter table public.stories  drop constraint stories_topic_check,  add constraint stories_topic_check  check (topic in ('ai', 'tesla', 'nvidia'));
alter table public.articles drop constraint articles_topic_check, add constraint articles_topic_check check (topic in ('ai', 'tesla', 'nvidia'));

-- The fuller story.
alter table public.stories
  add column why_company text,          -- Why it matters: for the company (2-3 sentences)
  add column why_stock   text,          -- Why it matters: for the stock (facts only, no advice)
  add column watch_next  jsonb,         -- [{ "when": "2027-01-29" | null, "what": "..." }]
  add column bull        jsonb,         -- [{ "text": "...", "claim": "a1" }] arguments from the sources only
  add column bear        jsonb,
  add column hype_score  int check (hype_score between 0 and 100), -- 100 = fully confirmed, 0 = pure hype
  add column hype_reason text,
  add column ticker      text,          -- the public company the story is about, for the price chart
  add column format      int not null default 1, -- 2 = written in the 5h format
  add column debunked    boolean not null default false,
  add column debunk_note text;          -- what really happened, shown next to the struck-through headline

-- Daily closing prices for the public companies we cover.
create table public.prices (
  ticker text not null,
  day    date not null,
  close  numeric(12, 4) not null,
  primary key (ticker, day)
);
alter table public.prices enable row level security;
create policy "read prices" on public.prices for select using (true);
