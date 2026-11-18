-- Milestone 5b: AI illustrations for stories (applied to project wzttcpnjnhsdhpcdqfhz on 2026-11-11).
-- No table changes: generated images live in public.images with tags:
--   'ai'         drawn by AI (the site shows an "Illustration" badge)
--   'generated'  the story's own image (stories/<story id>.jpg)
--   'library'    shared backup image per area (library/<topic>/<area>-<id>.jpg)
--   'superseded' an old image that is no longer used

-- Public bucket for the image files (max 2MB each).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 2000000, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Draw images for new stories every 10 minutes (the function stops at 120 images per day).
select cron.schedule('unhyped-images', '2,12,22,32,42,52 * * * *', $$select private.call_function('make-images')$$);
