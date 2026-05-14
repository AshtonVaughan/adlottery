-- ============================================================
-- PLACEHOLDER_NAME — Seed data
-- ============================================================
-- This seed is safe to run on an empty database. It does NOT
-- create auth.users — for the admin user, sign up via the app
-- using ADMIN_EMAILS and then run the SQL snippet in README to
-- flip is_admin on that profile.
-- ============================================================

-- ----------------------------------------------------------------
-- jurisdictions
-- ----------------------------------------------------------------
insert into public.jurisdictions
  (country_code, region_code, display_name, status, min_age, currency,
   requires_skill_question, requires_permit_above_amount, prize_cap_amount,
   kyc_required_before_payout, public_winner_display_mode,
   allowed_entry_methods, blocked_entry_methods, notes)
values
  ('US','north_america','United States','open',18,'USD', false, null, null, true, 'partial',
    array['daily_free_entry','referral_bonus','promo_code'], array[]::text[],
    'Sweepstakes-style, no purchase required. State-level rules must be reviewed by counsel before launch.'),
  ('CA','north_america','Canada','restricted',18,'CAD', true, null, null, true, 'partial',
    array['daily_free_entry','referral_bonus','promo_code'], array[]::text[],
    'Skill question required before prize claim is approved.'),
  ('GB','uk','United Kingdom','open',18,'GBP', false, null, null, true, 'partial',
    array['daily_free_entry','referral_bonus','promo_code'], array[]::text[],
    'Configured as free prize draw / prize competition. Final wording must be reviewed by counsel.'),
  ('AU','oceania','Australia','open',18,'AUD', false, 10000, null, true, 'partial',
    array['daily_free_entry','referral_bonus','promo_code'], array[]::text[],
    'Trade promotion. State-level thresholds must be reviewed by counsel.'),
  ('NZ','oceania','New Zealand','open',18,'NZD', false, null, null, true, 'partial',
    array['daily_free_entry','referral_bonus','promo_code'], array[]::text[], null),
  ('DE','western_europe','Germany','open',18,'EUR', false, null, null, true, 'partial',
    array['daily_free_entry','referral_bonus','promo_code'], array[]::text[], null),
  ('FR','western_europe','France','open',18,'EUR', false, null, null, true, 'partial',
    array['daily_free_entry','referral_bonus','promo_code'], array[]::text[], null),
  ('IE','western_europe','Ireland','open',18,'EUR', false, null, null, true, 'partial',
    array['daily_free_entry','referral_bonus','promo_code'], array[]::text[], null),
  ('SE','nordics','Sweden','open',18,'SEK', false, null, null, true, 'partial',
    array['daily_free_entry','referral_bonus','promo_code'], array[]::text[], null),
  ('NO','nordics','Norway','open',18,'NOK', false, null, null, true, 'partial',
    array['daily_free_entry','referral_bonus','promo_code'], array[]::text[], null),
  ('PL','eastern_europe','Poland','open',18,'PLN', false, null, null, true, 'partial',
    array['daily_free_entry','referral_bonus','promo_code'], array[]::text[], null),
  ('JP','east_asia','Japan','restricted',18,'JPY', false, null, 100000, true, 'anonymous',
    array['daily_free_entry','referral_bonus','promo_code'], array[]::text[],
    'Prize cap configurable. Final wording must be reviewed by counsel.'),
  ('KR','east_asia','South Korea','restricted',18,'KRW', false, null, null, true, 'anonymous',
    array['daily_free_entry','referral_bonus','promo_code'], array[]::text[], null),
  ('BR','latam','Brazil','restricted',18,'BRL', false, null, null, true, 'anonymous',
    array['daily_free_entry','referral_bonus','promo_code'], array[]::text[],
    'Restricted until permit workflow is handled.'),
  ('MX','latam','Mexico','open',18,'MXN', false, null, null, true, 'partial',
    array['daily_free_entry','referral_bonus','promo_code'], array[]::text[], null),
  ('AR','latam','Argentina','restricted',18,'ARS', false, null, null, true, 'anonymous',
    array['daily_free_entry','referral_bonus','promo_code'], array[]::text[], null),
  ('SG','sea','Singapore','open',18,'SGD', false, null, null, true, 'partial',
    array['daily_free_entry','referral_bonus','promo_code'], array[]::text[], null),
  ('PH','sea','Philippines','restricted',18,'PHP', false, 5000, null, true, 'anonymous',
    array['daily_free_entry','referral_bonus','promo_code'], array[]::text[],
    'Permit threshold configurable.'),
  ('MY','sea','Malaysia','restricted',18,'MYR', false, null, null, true, 'anonymous',
    array['daily_free_entry','referral_bonus','promo_code'], array[]::text[], null),
  ('ID','sea','Indonesia','restricted',18,'IDR', false, null, null, true, 'anonymous',
    array['daily_free_entry','referral_bonus','promo_code'], array[]::text[], null),
  ('IN','south_asia','India','restricted',18,'INR', true, null, null, true, 'partial',
    array['daily_free_entry','referral_bonus','promo_code'], array[]::text[],
    'Skill-based contest mode.'),
  ('AE','mena','United Arab Emirates','restricted',18,'AED', false, null, null, true, 'anonymous',
    array['daily_free_entry','referral_bonus','promo_code'], array[]::text[], null),
  ('SA','mena','Saudi Arabia','blocked',18,'SAR', false, null, null, true, 'anonymous',
    array[]::text[], array['daily_free_entry','referral_bonus','promo_code'],
    'Blocked by default.'),
  ('KW','mena','Kuwait','blocked',18,'KWD', false, null, null, true, 'anonymous',
    array[]::text[], array['daily_free_entry','referral_bonus','promo_code'],
    'Blocked by default.'),
  ('IR','mena','Iran','blocked',18,'IRR', false, null, null, true, 'anonymous',
    array[]::text[], array['daily_free_entry','referral_bonus','promo_code'],
    'Blocked by default.')
on conflict (country_code) do nothing;

-- ----------------------------------------------------------------
-- sample skill question
-- ----------------------------------------------------------------
insert into public.skill_questions (question, answer, active)
values
  ('What is 12 + 7 - 3? (numeric answer)', '16', true)
on conflict do nothing;

-- ----------------------------------------------------------------
-- sample sponsor
-- ----------------------------------------------------------------
insert into public.sponsors (name, url, contact_email, active)
values
  ('Acme Sponsorship Co.', 'https://example.com', 'partners@example.com', true)
on conflict do nothing;

-- ----------------------------------------------------------------
-- sample active weekly draw (open countries only)
-- ----------------------------------------------------------------
insert into public.draws
  (title, draw_type, prize_amount, currency, region_code,
   eligible_country_codes, excluded_country_codes,
   starts_at, ends_at, status)
select
  'Weekly Free Prize Draw',
  'weekly_draw',
  1000,
  'USD',
  null,
  array['US','GB','AU','NZ','DE','FR','IE','SE','NO','PL','SG','MX'],
  array[]::text[],
  now() - interval '1 day',
  now() + interval '6 days',
  'active'
where not exists (
  select 1 from public.draws where title = 'Weekly Free Prize Draw' and status = 'active'
);

-- ----------------------------------------------------------------
-- sample fraud flag (un-linked example for admin queue UX)
-- ----------------------------------------------------------------
insert into public.fraud_flags (user_id, entry_id, reason, severity, status, metadata)
select null, null, 'sample: device_hash shared across multiple accounts in 24h', 'medium', 'open',
       jsonb_build_object('demo', true, 'count', 5)
where not exists (
  select 1 from public.fraud_flags where reason like 'sample:%'
);

-- ----------------------------------------------------------------
-- sample completed draw (for archive)
-- ----------------------------------------------------------------
insert into public.draws
  (title, draw_type, prize_amount, currency, region_code,
   eligible_country_codes, excluded_country_codes,
   starts_at, ends_at, status,
   public_seed, public_seed_hash, randomness_source,
   published_at)
select
  'Launch Week Free Prize Draw',
  'weekly_draw',
  500,
  'USD',
  null,
  array['US','GB','AU','NZ','DE','FR','IE'],
  array[]::text[],
  now() - interval '14 days',
  now() - interval '7 days',
  'drawn',
  'seed-launch-week-001',
  encode(digest('seed-launch-week-001','sha256'),'hex'),
  'blockhash:placeholder:0000abcd',
  now() - interval '7 days'
where not exists (
  select 1 from public.draws where title = 'Launch Week Free Prize Draw'
);
