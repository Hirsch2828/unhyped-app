-- Milestone 5: more and better sources.
-- keywords: when set, ingest keeps only items whose title/summary match one of them
--           (lets us use general feeds such as CNBC Tech without off-topic stories).
-- fail_count: failures in a row; ingest switches a source off after too many.

alter table public.sources
  add column if not exists keywords   text[] not null default '{}',
  add column if not exists fail_count int    not null default 0;

-- Shared keyword lists
create temp table _kw (topic text primary key, words text[]);
insert into _kw values
  ('ai', array['ai','artificial intelligence','openai','chatgpt','gpt','gemini','claude','anthropic','llm','llms',
               'nvidia','machine learning','deepmind','copilot','chatbot','chatbots','generative','agi','xai','grok',
               'mistral','llama','data center','data centers','neural']),
  ('tesla', array['tesla','musk','cybertruck','cybercab','robotaxi','optimus','fsd','full self-driving','megapack',
                  'powerwall','supercharger','model y','model 3','model s','model x']);

-- ---------- Fix what's broken ----------
-- Hacker News front page is not AI-only: keep only AI items.
update public.sources set keywords = (select words from _kw where topic = 'ai')
 where url = 'https://hnrss.org/frontpage?points=300';

-- VentureBeat: always 429 from our servers, and its FeedBurner mirror stopped in Sep 2026.
update public.sources set active = false,
       last_error = 'disabled: blocked (HTTP 429) and the backup feed is stale'
 where url = 'https://venturebeat.com/category/ai/feed/';

-- Microsoft AI blog feed is gone (410). Use Microsoft's newsroom, filtered to AI.
update public.sources set name = 'Microsoft Source (AI)', url = 'https://news.microsoft.com/source/feed/',
       site_url = 'https://news.microsoft.com/source/', keywords = (select words from _kw where topic = 'ai'),
       active = true, last_error = null, fail_count = 0
 where url = 'https://blogs.microsoft.com/ai/feed/';

-- Tesla has no public RSS feed (ir.tesla.com -> 404, tesla.com -> 403).
-- Official replacement: Tesla's SEC filings (8-K), added below.
update public.sources set last_error = 'disabled: Tesla has no public RSS feed (IR 404, tesla.com 403). Replaced by SEC filings.'
 where url = 'https://ir.tesla.com/rss/news-releases';

-- ---------- New sources (each one checked on 2026-11-11: HTTP 200 + recent items) ----------
insert into public.sources (name, url, site_url, tier, topic, keywords) values
  -- AI: official
  ('Microsoft Research',      'https://www.microsoft.com/en-us/research/feed/',  'https://www.microsoft.com/en-us/research/', 'official', 'ai', '{}'),
  ('Meta Newsroom (AI)',      'https://about.fb.com/feed/',                      'https://about.fb.com/news/',                 'official', 'ai', (select words from _kw where topic = 'ai')),
  ('Apple Machine Learning',  'https://machinelearning.apple.com/rss.xml',       'https://machinelearning.apple.com/',         'official', 'ai', '{}'),
  ('Google Research',         'https://research.google/blog/rss/',               'https://research.google/blog/',              'official', 'ai', '{}'),
  -- AI: news
  ('ZDNET AI',                'https://www.zdnet.com/topic/artificial-intelligence/rss.xml', 'https://www.zdnet.com/topic/artificial-intelligence/', 'news', 'ai', '{}'),
  ('The Guardian AI',         'https://www.theguardian.com/technology/artificialintelligenceai/rss', 'https://www.theguardian.com/technology/artificialintelligenceai', 'news', 'ai', '{}'),
  ('The Decoder',             'https://the-decoder.com/feed/',                   'https://the-decoder.com/',                   'news', 'ai', '{}'),
  ('404 Media (AI)',          'https://www.404media.co/rss/',                    'https://www.404media.co/',                   'news', 'ai', (select words from _kw where topic = 'ai')),
  ('CNBC Tech (AI)',          'https://www.cnbc.com/id/19854910/device/rss/rss.html', 'https://www.cnbc.com/technology/',      'news', 'ai', (select words from _kw where topic = 'ai')),
  ('NYT Technology (AI)',     'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', 'https://www.nytimes.com/section/technology', 'news', 'ai', (select words from _kw where topic = 'ai')),
  ('BBC Technology (AI)',     'https://feeds.bbci.co.uk/news/technology/rss.xml', 'https://www.bbc.com/news/technology',       'news', 'ai', (select words from _kw where topic = 'ai')),
  ('Axios (AI)',              'https://api.axios.com/feed/',                     'https://www.axios.com/technology',           'news', 'ai', (select words from _kw where topic = 'ai')),
  -- AI: signal
  ('r/LocalLLaMA (top today)', 'https://www.reddit.com/r/LocalLLaMA/top/.rss?t=day', 'https://www.reddit.com/r/LocalLLaMA/',    'signal', 'ai', '{}'),
  ('Simon Willison''s blog',  'https://simonwillison.net/atom/everything/',      'https://simonwillison.net/',                 'signal', 'ai', (select words from _kw where topic = 'ai')),
  -- Tesla: official
  ('Tesla SEC filings (8-K)', 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001318605&type=8-K&owner=include&count=20&output=atom',
                              'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001318605', 'official', 'tesla', '{}'),
  -- Tesla: news
  ('Reuters Tesla (via Google News)', 'https://news.google.com/rss/search?q=Tesla+when:1d+site:reuters.com&hl=en-US&gl=US&ceid=US:en',
                              'https://www.reuters.com/business/autos-transportation/', 'news', 'tesla', '{}'),
  ('InsideEVs Tesla',         'https://insideevs.com/rss/make/tesla/',           'https://insideevs.com/tesla/',               'news', 'tesla', '{}'),
  ('CleanTechnica Tesla',     'https://cleantechnica.com/tag/tesla/feed/',       'https://cleantechnica.com/tag/tesla/',       'news', 'tesla', '{}'),
  ('Not a Tesla App',         'https://www.notateslaapp.com/rss',                'https://www.notateslaapp.com/',              'news', 'tesla', '{}'),
  ('Tesla Oracle',            'https://www.teslaoracle.com/feed/',               'https://www.teslaoracle.com/',               'news', 'tesla', '{}'),
  ('Drive Tesla Canada',      'https://driveteslacanada.ca/feed/',               'https://driveteslacanada.ca/',               'news', 'tesla', '{}'),
  ('CNBC (Tesla)',            'https://www.cnbc.com/id/10000101/device/rss/rss.html', 'https://www.cnbc.com/',                 'news', 'tesla', (select words from _kw where topic = 'tesla'))
on conflict (url) do nothing;
