-- ============================================================
-- PLACEHOLDER_NAME — Initial schema
-- ============================================================
-- Free prize draw platform. NOT a casino, NOT betting,
-- NOT wagering, NOT a paid lottery, NOT crypto.
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- profiles
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  dob date not null,
  country_code text not null,
  region_code text not null,
  state_or_province text null,
  is_admin boolean not null default false,
  referral_code text unique not null,
  referred_by uuid null references public.profiles(id) on delete set null,
  terms_accepted_at timestamptz not null,
  privacy_accepted_at timestamptz not null,
  draw_rules_accepted_at timestamptz not null,
  eligibility_status text not null
    check (eligibility_status in ('eligible','restricted','waitlisted','blocked')),
  banned_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_country_idx on public.profiles(country_code);
create index if not exists profiles_referred_by_idx on public.profiles(referred_by);

-- ============================================================
-- jurisdictions
-- ============================================================
create table if not exists public.jurisdictions (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  region_code text not null,
  display_name text not null,
  status text not null check (status in ('open','restricted','waitlist','blocked')),
  min_age integer not null default 18,
  currency text not null default 'AUD',
  requires_skill_question boolean not null default false,
  requires_permit_above_amount numeric(12,2) null,
  prize_cap_amount numeric(12,2) null,
  kyc_required_before_payout boolean not null default true,
  public_winner_display_mode text not null
    check (public_winner_display_mode in ('full','partial','anonymous')),
  allowed_entry_methods text[] not null
    default array['daily_free_entry','referral_bonus','promo_code'],
  blocked_entry_methods text[] not null default array[]::text[],
  terms_version text not null default 'v1',
  privacy_version text not null default 'v1',
  draw_rules_version text not null default 'v1',
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_code)
);

create index if not exists jurisdictions_region_idx on public.jurisdictions(region_code);
create index if not exists jurisdictions_status_idx on public.jurisdictions(status);

-- ============================================================
-- draws
-- ============================================================
create table if not exists public.draws (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  draw_type text not null
    check (draw_type in ('weekly_draw','monthly_grand_draw','threshold_draw','sponsored_draw')),
  prize_amount numeric(12,2) not null,
  currency text not null default 'AUD',
  region_code text null,
  eligible_country_codes text[] not null,
  excluded_country_codes text[] not null default array[]::text[],
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null check (status in ('draft','active','locked','drawn','cancelled')),
  public_seed text null,
  public_seed_hash text null,
  randomness_source text null,
  winning_entry_id uuid null,
  sponsor_name text null,
  sponsor_url text null,
  published_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists draws_status_idx on public.draws(status);
create index if not exists draws_window_idx on public.draws(starts_at, ends_at);

-- ============================================================
-- entries
-- ============================================================
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  draw_id uuid not null references public.draws(id) on delete cascade,
  source text not null
    check (source in ('daily_free_entry','referral_bonus','promo_code','manual_adjustment','sponsor_challenge')),
  source_ref text null,
  ip_hash text null,
  device_hash text null,
  country_code text not null,
  region_code text not null,
  created_at timestamptz not null default now()
);

create index if not exists entries_draw_idx on public.entries(draw_id);
create index if not exists entries_user_idx on public.entries(user_id);
create index if not exists entries_draw_created_idx on public.entries(draw_id, created_at, id);

-- ============================================================
-- daily_entry_claims
-- ============================================================
create table if not exists public.daily_entry_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  draw_id uuid not null references public.draws(id) on delete cascade,
  claim_date date not null,
  entry_id uuid not null references public.entries(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, draw_id, claim_date)
);

-- ============================================================
-- referrals
-- ============================================================
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.profiles(id) on delete cascade,
  referred_user_id uuid not null references public.profiles(id) on delete cascade,
  draw_id uuid null references public.draws(id) on delete set null,
  status text not null check (status in ('pending','rewarded','rejected')),
  created_at timestamptz not null default now(),
  rewarded_at timestamptz null,
  unique (referrer_user_id, referred_user_id)
);

create index if not exists referrals_referrer_idx on public.referrals(referrer_user_id);
create index if not exists referrals_referred_idx on public.referrals(referred_user_id);

-- ============================================================
-- winner_claims
-- ============================================================
create table if not exists public.winner_claims (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  winning_entry_id uuid not null references public.entries(id) on delete cascade,
  claim_status text not null
    check (claim_status in ('pending','verification_required','skill_question_required','verified','rejected','expired')),
  identity_status text null,
  skill_question_required boolean not null default false,
  skill_question_answered boolean not null default false,
  skill_question_correct boolean null,
  payout_status text not null
    check (payout_status in ('not_started','pending','paid','failed','cancelled')),
  payout_reference text null,
  admin_notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (draw_id)
);

-- ============================================================
-- skill_questions
-- ============================================================
create table if not exists public.skill_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- promo_codes
-- ============================================================
create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  draw_id uuid references public.draws(id) on delete cascade,
  bonus_entries integer not null default 1,
  eligible_country_codes text[] null,
  max_uses integer null,
  uses_count integer not null default 0,
  starts_at timestamptz null,
  expires_at timestamptz null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- fraud_flags
-- ============================================================
create table if not exists public.fraud_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  entry_id uuid references public.entries(id) on delete cascade,
  reason text not null,
  severity text not null check (severity in ('low','medium','high')),
  status text not null check (status in ('open','reviewed','dismissed','confirmed')),
  metadata jsonb null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz null
);

create index if not exists fraud_flags_status_idx on public.fraud_flags(status);

-- ============================================================
-- audit_logs
-- ============================================================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid null references public.profiles(id) on delete set null,
  action text not null,
  entity_type text null,
  entity_id uuid null,
  metadata jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);
create index if not exists audit_logs_actor_idx on public.audit_logs(actor_user_id);

-- ============================================================
-- waitlist
-- ============================================================
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  country_code text not null,
  region_code text null,
  source text null,
  created_at timestamptz not null default now(),
  unique (email, country_code)
);

-- ============================================================
-- sponsors
-- ============================================================
create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text null,
  logo_url text null,
  contact_email text null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ad_config
-- ============================================================
create table if not exists public.ad_config (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  enabled boolean not null default false,
  placement text not null,
  region_code text null,
  country_code text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Updated_at triggers
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'profiles','jurisdictions','draws','winner_claims','ad_config'
  ]) loop
    execute format(
      'drop trigger if exists trg_%I_updated_at on public.%I;', t, t
    );
    execute format(
      'create trigger trg_%I_updated_at before update on public.%I
       for each row execute function public.touch_updated_at();',
      t, t
    );
  end loop;
end$$;
