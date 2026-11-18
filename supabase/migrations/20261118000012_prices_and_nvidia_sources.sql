-- Milestone 5h (applied 2026-11-18): Nvidia sources and the daily price job.
insert into public.sources (name, url, tier, topic, active, keywords) values
('NVIDIA Newsroom', 'https://nvidianews.nvidia.com/releases.xml', 'official', 'nvidia', true, '{}'),
('The Verge Nvidia', 'https://www.theverge.com/rss/nvidia/index.xml', 'news', 'nvidia', true, '{}'),
('Tom''s Hardware (chips)', 'https://www.tomshardware.com/feeds/all', 'news', 'nvidia', true, array['nvidia','gpu','gpus','tsmc','amd','intel','chip','chips','semiconductor','blackwell','rubin','hbm','foundry','data center']),
('ServeTheHome (chips)', 'https://www.servethehome.com/feed/', 'news', 'nvidia', true, array['nvidia','gpu','gpus','tsmc','amd','intel','chip','chips','semiconductor','blackwell','rubin','hbm','data center']),
('SemiAnalysis', 'https://semianalysis.com/feed/', 'news', 'nvidia', true, '{}');

-- Closing prices once a day, after the US market closes (Mon-Fri).
select cron.schedule('unhyped-prices', '30 22 * * 1-5', $$select private.call_function('prices')$$);
