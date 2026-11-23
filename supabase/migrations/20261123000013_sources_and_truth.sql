-- Milestone 6: sources and truth (data only, no schema change). Every step can be undone.

-- 1. Only AI, Tesla and Nvidia: pause the 5י sector sources (not deleted).
update sources
   set active = false,
       last_error = 'paused in milestone 6: only AI, Tesla and Nvidia for now'
 where topic not in ('ai', 'tesla', 'nvidia') and active;

-- 2. Source roles. Fan blogs and Hacker News only discover; Simon Willison is an approved journalist.
update sources set tier = 'signal'
 where name in ('Drive Tesla Canada', 'Not a Tesla App', 'Teslarati', 'Tesla Oracle', 'CleanTechnica Tesla', 'Hacker News (300+ points)');
update sources set tier = 'news' where name = 'Simon Willison''s blog';

-- 3. SemiAnalysis's feed has not had a new post since September 2025.
update sources set active = false, last_error = 'paused in milestone 6: feed has no posts since Sep 2025'
 where name = 'SemiAnalysis';

-- 4. New official sources. Anthropic, xAI and Mistral publish no RSS of their own, so we read a public
--    mirror of their news pages (github.com/Olshansk/rss-feeds); every link points to the company's own site.
insert into sources (name, url, topic, tier, keywords, active) values
  ('Anthropic News', 'https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_news.xml', 'ai', 'official', '{}', true),
  ('xAI News', 'https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_xainews.xml', 'ai', 'official', '{}', true),
  ('Mistral AI News', 'https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_mistral.xml', 'ai', 'official', '{}', true),
  ('Nvidia SEC filings (8-K)', 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001045810&type=8-K&owner=include&count=20&output=atom', 'nvidia', 'official', '{}', true)
on conflict (url) do update set active = true, tier = excluded.tier, topic = excluded.topic;

-- 5. The truth rule on stories already in the database: no editor queue, and no story stays up on discovery sources alone.
update stories s set status = 'published', published_at = coalesce(s.published_at, now()), updated_at = now()
 where s.status = 'pending_review'
   and exists (select 1 from articles a join sources src on src.id = a.source_id
                where a.story_id = s.id and src.tier in ('official', 'news'));
update stories s set status = 'draft', updated_at = now()
 where s.status in ('published', 'pending_review')
   and s.topic in ('ai', 'tesla', 'nvidia')
   and s.last_article_at > now() - interval '7 days'
   and not exists (select 1 from articles a join sources src on src.id = a.source_id
                    where a.story_id = s.id and src.tier in ('official', 'news'));

-- 6. Nvidia row: this week's AI stories with Nvidia in the headline move to the Nvidia topic
--    (new articles are routed the same way by ingest's topicFor).
update stories set topic = 'nvidia', updated_at = now()
 where topic = 'ai' and title ~* '\mnvidia\M'
   and last_article_at > now() - interval '7 days' and status <> 'rejected';

-- 7. Fast journalists approved by Ori (23/11), as discovery sources only: they can start a story,
--    and it goes live only when an official or approved news source joins.
insert into sources (name, url, topic, tier, keywords, active) values
  ('Hayden Field (Bluesky)', 'https://bsky.app/profile/haydenfield.bsky.social/rss', 'ai', 'signal', '{AI,OpenAI,Anthropic,ChatGPT,Claude,Gemini,Google,Microsoft,Copilot,Meta,xAI,Grok,Mistral,Nvidia,Tesla,Musk,LLM,robot,robots,robotaxi}', true),
  ('Casey Newton (Bluesky)', 'https://bsky.app/profile/caseynewton.bsky.social/rss', 'ai', 'signal', '{AI,OpenAI,Anthropic,ChatGPT,Claude,Gemini,Google,Microsoft,Copilot,Meta,xAI,Grok,Mistral,Nvidia,Tesla,Musk,LLM,robot,robots,robotaxi}', true),
  ('Nilay Patel (Bluesky)', 'https://bsky.app/profile/reckless.bsky.social/rss', 'ai', 'signal', '{AI,OpenAI,Anthropic,ChatGPT,Claude,Gemini,Google,Microsoft,Copilot,Meta,xAI,Grok,Mistral,Nvidia,Tesla,Musk,LLM,robot,robots,robotaxi}', true),
  ('Tom Warren (Bluesky)', 'https://bsky.app/profile/tomwarren.co.uk/rss', 'ai', 'signal', '{AI,OpenAI,Anthropic,ChatGPT,Claude,Gemini,Google,Microsoft,Copilot,Meta,xAI,Grok,Mistral,Nvidia,Tesla,Musk,LLM,robot,robots,robotaxi}', true)
on conflict (url) do update set active = true, tier = excluded.tier, keywords = excluded.keywords;
