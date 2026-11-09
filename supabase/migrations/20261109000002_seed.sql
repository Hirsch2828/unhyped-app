-- Starter sources. Feed URLs can change: the ingest function writes last_error per source,
-- so check `select name, last_error from sources where last_error is not null;` after the first run.

insert into public.sources (name, url, site_url, tier, topic) values
  -- AI: official (company / lab blogs)
  ('OpenAI News',          'https://openai.com/news/rss.xml',                         'https://openai.com/news',            'official', 'ai'),
  ('Google AI Blog',       'https://blog.google/technology/ai/rss/',                  'https://blog.google/technology/ai/', 'official', 'ai'),
  ('Google DeepMind',      'https://deepmind.google/blog/rss.xml',                    'https://deepmind.google/discover/blog/', 'official', 'ai'),
  ('Microsoft AI Blog',    'https://blogs.microsoft.com/ai/feed/',                    'https://blogs.microsoft.com/ai/',    'official', 'ai'),
  ('NVIDIA Blog',          'https://blogs.nvidia.com/feed/',                          'https://blogs.nvidia.com/',          'official', 'ai'),
  ('Hugging Face Blog',    'https://huggingface.co/blog/feed.xml',                    'https://huggingface.co/blog',        'official', 'ai'),
  -- AI: news
  ('The Verge AI',         'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', 'https://www.theverge.com/ai-artificial-intelligence', 'news', 'ai'),
  ('TechCrunch AI',        'https://techcrunch.com/category/artificial-intelligence/feed/', 'https://techcrunch.com/category/artificial-intelligence/', 'news', 'ai'),
  ('Ars Technica AI',      'https://arstechnica.com/ai/feed/',                        'https://arstechnica.com/ai/',        'news', 'ai'),
  ('MIT Technology Review AI', 'https://www.technologyreview.com/topic/artificial-intelligence/feed', 'https://www.technologyreview.com/topic/artificial-intelligence/', 'news', 'ai'),
  ('VentureBeat AI',       'https://venturebeat.com/category/ai/feed/',               'https://venturebeat.com/category/ai/', 'news', 'ai'),
  ('Wired AI',             'https://www.wired.com/feed/tag/ai/latest/rss',            'https://www.wired.com/tag/artificial-intelligence/', 'news', 'ai'),
  -- AI: signals (fast, unverified)
  ('Hacker News (300+ points)', 'https://hnrss.org/frontpage?points=300',             'https://news.ycombinator.com',       'signal', 'ai'),
  ('r/artificial (top today)',  'https://www.reddit.com/r/artificial/top/.rss?t=day', 'https://www.reddit.com/r/artificial', 'signal', 'ai'),
  -- Tesla: official
  ('Tesla Investor Relations', 'https://ir.tesla.com/rss/news-releases',              'https://ir.tesla.com',               'official', 'tesla'),
  -- Tesla: news
  ('Electrek Tesla',       'https://electrek.co/guides/tesla/feed/',                  'https://electrek.co/guides/tesla/',  'news', 'tesla'),
  ('Teslarati',            'https://www.teslarati.com/feed/',                         'https://www.teslarati.com',          'news', 'tesla'),
  ('The Verge Tesla',      'https://www.theverge.com/rss/tesla/index.xml',            'https://www.theverge.com/tesla',     'news', 'tesla'),
  -- Tesla: signals
  ('r/teslamotors (top today)', 'https://www.reddit.com/r/teslamotors/top/.rss?t=day', 'https://www.reddit.com/r/teslamotors', 'signal', 'tesla')
on conflict (url) do nothing;

-- Image library: placeholders served by the web app itself (public/img). Replace with final images later.
insert into public.images (path, topic, tags, alt) values
  ('img/ai-hero.jpg',        'ai',    '{agents,models,hero}',  'Humanoid robot looking over a city at sunset'),
  ('img/robot-portrait.jpg', 'ai',    '{models,research}',     'Robot profile at golden hour'),
  ('img/city.jpg',           'ai',    '{business,tools}',      'City skyline at sunset'),
  ('img/policy.jpg',         'ai',    '{policy}',              'Government building at sunset'),
  ('img/chip.jpg',           'ai',    '{infrastructure,chips}','Close-up of a computer chip'),
  ('img/robot-arm.jpg',      'ai',    '{robotics,agents}',     'Robotic arm in a factory'),
  ('img/robots.jpg',         'tesla', '{optimus,robotics}',    'Humanoid robots in a factory'),
  ('img/tesla-car.jpg',      'tesla', '{vehicles}',            'Grey electric sedan on a desert road'),
  ('img/tesla-card.jpg',     'tesla', '{vehicles,fsd}',        'Electric sedan near mountains'),
  ('img/tesla-light.jpg',    'tesla', '{vehicles,fsd}',        'Tail light of an electric car'),
  ('img/energy.jpg',         'tesla', '{energy}',              'Wind turbines and solar panels at sunset'),
  ('img/markets.jpg',        'tesla', '{markets,earnings}',    'Stock chart on a screen');
