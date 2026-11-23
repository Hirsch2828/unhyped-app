-- Two new story sections (23/11, Ori): "What it means for you" and "Who wins, who loses". Additive only.
alter table stories add column if not exists for_you text;
alter table stories add column if not exists winners_losers jsonb not null default '[]'::jsonb;
