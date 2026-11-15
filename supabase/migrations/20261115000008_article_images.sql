-- Lead image of each article, taken from its RSS feed. Shown on the story with the source's name as credit.
alter table articles add column if not exists image_url text;
