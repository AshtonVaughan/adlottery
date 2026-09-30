-- Optional: a sample sponsor. Draws are created automatically by the
-- daily cron (or the "Run lifecycle now" button in /admin), because each
-- draw needs a server-generated secret seed.
insert into public.sponsors (name, url, tagline)
select 'Example Sponsor', 'https://example.com', 'Proudly funding this week''s pot'
where not exists (select 1 from public.sponsors where name = 'Example Sponsor');
