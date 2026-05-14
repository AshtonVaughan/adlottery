-- ============================================================
-- PLACEHOLDER_NAME — Row Level Security
-- ============================================================
-- Server-only writes for entries, draws, claims, audit logs.
-- ============================================================

alter table public.profiles            enable row level security;
alter table public.jurisdictions       enable row level security;
alter table public.draws               enable row level security;
alter table public.entries             enable row level security;
alter table public.daily_entry_claims  enable row level security;
alter table public.referrals           enable row level security;
alter table public.winner_claims       enable row level security;
alter table public.skill_questions     enable row level security;
alter table public.promo_codes         enable row level security;
alter table public.fraud_flags         enable row level security;
alter table public.audit_logs          enable row level security;
alter table public.waitlist            enable row level security;
alter table public.sponsors            enable row level security;
alter table public.ad_config           enable row level security;

-- ============================================================
-- helper: is_admin()
-- ============================================================
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = uid),
    false
  );
$$;

-- ============================================================
-- profiles
-- ============================================================
drop policy if exists profiles_read_self on public.profiles;
create policy profiles_read_self on public.profiles
  for select using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- Users cannot self-promote, self-ban, or rewrite legal acceptance.
    and is_admin = (select is_admin from public.profiles where id = auth.uid())
    and banned_at is not distinct from (select banned_at from public.profiles where id = auth.uid())
  );

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ============================================================
-- jurisdictions — public read of active/availability data
-- ============================================================
drop policy if exists jurisdictions_read_all on public.jurisdictions;
create policy jurisdictions_read_all on public.jurisdictions
  for select using (true);

drop policy if exists jurisdictions_admin_write on public.jurisdictions;
create policy jurisdictions_admin_write on public.jurisdictions
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ============================================================
-- draws — public read; admin/server write only
-- ============================================================
drop policy if exists draws_read_all on public.draws;
create policy draws_read_all on public.draws
  for select using (true);

drop policy if exists draws_admin_write on public.draws;
create policy draws_admin_write on public.draws
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ============================================================
-- entries — user reads own; no client writes
-- ============================================================
drop policy if exists entries_read_self on public.entries;
create policy entries_read_self on public.entries
  for select using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists entries_admin_write on public.entries;
create policy entries_admin_write on public.entries
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
-- All other writes happen via the service-role server runtime,
-- which bypasses RLS by design.

-- ============================================================
-- daily_entry_claims — user reads own; no client writes
-- ============================================================
drop policy if exists daily_claims_read_self on public.daily_entry_claims;
create policy daily_claims_read_self on public.daily_entry_claims
  for select using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists daily_claims_admin_write on public.daily_entry_claims;
create policy daily_claims_admin_write on public.daily_entry_claims
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ============================================================
-- referrals — user reads own (either direction)
-- ============================================================
drop policy if exists referrals_read_self on public.referrals;
create policy referrals_read_self on public.referrals
  for select using (
    auth.uid() = referrer_user_id
    or auth.uid() = referred_user_id
    or public.is_admin(auth.uid())
  );

drop policy if exists referrals_admin_write on public.referrals;
create policy referrals_admin_write on public.referrals
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ============================================================
-- winner_claims — winner reads own; admin manages
-- ============================================================
drop policy if exists winner_claims_read_self on public.winner_claims;
create policy winner_claims_read_self on public.winner_claims
  for select using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists winner_claims_admin_write on public.winner_claims;
create policy winner_claims_admin_write on public.winner_claims
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ============================================================
-- skill_questions — questions hidden from public; admin only
-- ============================================================
drop policy if exists skill_questions_admin_all on public.skill_questions;
create policy skill_questions_admin_all on public.skill_questions
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ============================================================
-- promo_codes — admin only on client; redemption happens server-side
-- ============================================================
drop policy if exists promo_codes_admin_all on public.promo_codes;
create policy promo_codes_admin_all on public.promo_codes
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ============================================================
-- fraud_flags — admin only
-- ============================================================
drop policy if exists fraud_flags_admin_all on public.fraud_flags;
create policy fraud_flags_admin_all on public.fraud_flags
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ============================================================
-- audit_logs — admin read only; server writes via service role
-- ============================================================
drop policy if exists audit_logs_admin_read on public.audit_logs;
create policy audit_logs_admin_read on public.audit_logs
  for select using (public.is_admin(auth.uid()));

drop policy if exists audit_logs_admin_write on public.audit_logs;
create policy audit_logs_admin_write on public.audit_logs
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ============================================================
-- waitlist — anyone may insert; only admins may read
-- ============================================================
drop policy if exists waitlist_insert_any on public.waitlist;
create policy waitlist_insert_any on public.waitlist
  for insert with check (true);

drop policy if exists waitlist_admin_read on public.waitlist;
create policy waitlist_admin_read on public.waitlist
  for select using (public.is_admin(auth.uid()));

drop policy if exists waitlist_admin_write on public.waitlist;
create policy waitlist_admin_write on public.waitlist
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ============================================================
-- sponsors — public read; admin write
-- ============================================================
drop policy if exists sponsors_read_all on public.sponsors;
create policy sponsors_read_all on public.sponsors
  for select using (true);

drop policy if exists sponsors_admin_write on public.sponsors;
create policy sponsors_admin_write on public.sponsors
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ============================================================
-- ad_config — admin only
-- ============================================================
drop policy if exists ad_config_admin_all on public.ad_config;
create policy ad_config_admin_all on public.ad_config
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
