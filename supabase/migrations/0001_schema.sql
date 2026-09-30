-- ============================================================
-- The Weekly Pot: one free weekly draw funded by sponsors and ads.
--
-- The site is static (GitHub Pages), so every rule lives here:
--   * Browsers call the public functions below with the anon key.
--     Row level security keeps tables read-only or owner-only.
--   * The hourly GitHub Actions job calls the _-prefixed functions
--     with the service role key: it closes draws, fetches the drand
--     beacon and completes draws.
--
-- Fairness: each draw's secret seed is generated here and kept in
-- draw_secrets (no client access). Only sha256(seed) and a future drand
-- round are published up front; the seed is revealed at draw time.
-- winner_index = first 52 bits of sha256(seed || '|' || randomness)
--                mod entry count, entries ordered by (created_at, id).
-- ============================================================

-- ------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------
create table public.app_settings (
  id boolean primary key default true check (id),
  excluded_countries text[] not null default '{CU,IR,KP,SY,RU,BY}',
  ad_share_percent numeric(5, 2) not null default 50 check (ad_share_percent between 0 and 100),
  rules_version text not null default '2026-10-01',
  claim_window_days integer not null default 30,
  currency text not null default 'USD'
);
insert into public.app_settings default values;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text null,
  country_code text null check (country_code ~ '^[A-Z]{2}$'),
  confirmed_adult_at timestamptz null,
  accepted_rules_version text null,
  is_admin boolean not null default false,
  banned_at timestamptz null,
  created_at timestamptz not null default now()
);

create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text null,
  tagline text null,
  created_at timestamptz not null default now()
);

create table public.draws (
  id uuid primary key default gen_random_uuid(),
  week_start date not null unique,
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  status text not null default 'open' check (status in ('open', 'closed', 'drawn')),
  currency text not null default 'USD',
  sponsor_id uuid null references public.sponsors(id) on delete set null,
  seed_hash text not null,
  randomness_round bigint not null,
  seed text null,
  randomness text null,
  total_entries integer null,
  winner_index integer null,
  winning_entry_id uuid null,
  prize_amount numeric(12, 2) null,
  drawn_at timestamptz null,
  created_at timestamptz not null default now(),
  check (closes_at > opens_at)
);

create table public.draw_secrets (
  draw_id uuid primary key references public.draws(id) on delete cascade,
  seed text not null
);

create table public.pot_contributions (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws(id) on delete cascade,
  source text not null check (source in ('sponsor', 'ads', 'rollover')),
  amount numeric(12, 2) not null check (amount > 0),
  note text null,
  created_at timestamptz not null default now()
);
create index pot_contributions_draw_idx on public.pot_contributions(draw_id);

-- user_id is nulled on account deletion so published entry lists never change.
create table public.entries (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws(id) on delete cascade,
  user_id uuid null references public.profiles(id) on delete set null,
  entry_date date not null,
  created_at timestamptz not null default now(),
  unique (draw_id, user_id, entry_date)
);
create index entries_draw_order_idx on public.entries(draw_id, created_at, id);
create index entries_user_idx on public.entries(user_id);

create table public.winners (
  draw_id uuid primary key references public.draws(id) on delete cascade,
  user_id uuid null references public.profiles(id) on delete set null,
  entry_id uuid not null references public.entries(id),
  amount numeric(12, 2) not null,
  currency text not null,
  status text not null default 'pending'
    check (status in ('pending', 'claimed', 'verified', 'paid', 'forfeited')),
  legal_name text null,
  payout_details text null,
  payout_reference text null,
  claim_deadline timestamptz not null,
  claimed_at timestamptz null,
  paid_at timestamptz null,
  created_at timestamptz not null default now()
);
create index winners_user_idx on public.winners(user_id);

-- ------------------------------------------------------------
-- Row level security: reads only. All writes go through functions.
-- ------------------------------------------------------------
alter table public.app_settings      enable row level security;
alter table public.profiles          enable row level security;
alter table public.sponsors          enable row level security;
alter table public.draws             enable row level security;
alter table public.draw_secrets      enable row level security;
alter table public.pot_contributions enable row level security;
alter table public.entries           enable row level security;
alter table public.winners           enable row level security;

create policy app_settings_read on public.app_settings for select using (true);
create policy sponsors_read on public.sponsors for select using (true);
create policy draws_read on public.draws for select using (true);
create policy pot_contributions_read on public.pot_contributions for select using (true);
create policy profiles_read_own on public.profiles for select using (auth.uid() = id);
create policy entries_read_own on public.entries for select using (auth.uid() = user_id);
create policy winners_read_own on public.winners for select using (auth.uid() = user_id);
-- draw_secrets: no policies at all.

-- New auth users get a profile row.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email) values (new.id, lower(new.email)) on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- Helpers
-- ------------------------------------------------------------

-- drand quicknet: genesis 1692803367, one round every 3 seconds.
-- First round published at or after p_at. Mirrors src/lib/drand.ts.
create function public.drand_round_at(p_at timestamptz) returns bigint
language sql immutable as $$
  select greatest(1, ceil((ceil(extract(epoch from p_at)) - 1692803367) / 3.0)::bigint + 1)
$$;

create function public.drand_round_time(p_round bigint) returns timestamptz
language sql immutable as $$
  select to_timestamp(1692803367 + (p_round - 1) * 3)
$$;

create function public.sha256_hex(p text) returns text
language sql immutable as $$
  select encode(sha256(convert_to(p, 'UTF8')), 'hex')
$$;

-- First 52 bits of sha256(seed || '|' || randomness) mod n. Mirrors src/lib/hash.ts.
create function public.winner_index(p_seed text, p_randomness text, p_total integer) returns integer
language sql immutable as $$
  select (('x' || lpad(substr(sha256_hex(p_seed || '|' || p_randomness), 1, 13), 16, '0'))::bit(64)::bigint
          % p_total)::integer
$$;

create function public.week_label(p_week date) returns text
language sql immutable as $$
  select 'Week ' || extract(week from p_week)::int || ', ' || extract(isoyear from p_week)::int
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin and banned_at is null from profiles where id = auth.uid()), false)
$$;

create function public.pot_summary(p_draw_id uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'sponsor',  coalesce(sum(amount) filter (where source = 'sponsor'), 0),
    'ads',      coalesce(sum(amount) filter (where source = 'ads'), 0),
    'rollover', coalesce(sum(amount) filter (where source = 'rollover'), 0),
    'total',    coalesce(sum(amount), 0))
  from pot_contributions where draw_id = p_draw_id
$$;

-- Creates the draw for the week containing p_now (Monday 00:00 UTC to
-- next Monday), with a fresh secret seed. Idempotent.
create function public._ensure_draw_for(p_now timestamptz) returns public.draws
language plpgsql security definer set search_path = public as $$
declare
  v_week date := date_trunc('week', p_now at time zone 'UTC')::date;
  v_open timestamptz := v_week::timestamp at time zone 'UTC';
  v_close timestamptz := v_open + interval '7 days';
  v_draw draws;
  v_seed text;
begin
  select * into v_draw from draws where week_start = v_week;
  if found then return v_draw; end if;

  -- 2 x 122 random bits from gen_random_uuid (a CSPRNG).
  v_seed := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into draws (week_start, opens_at, closes_at, currency, seed_hash, randomness_round)
  values (v_week, v_open, v_close, (select currency from app_settings), sha256_hex(v_seed),
          drand_round_at(greatest(v_close, p_now) + interval '60 seconds'))
  on conflict (week_start) do nothing
  returning * into v_draw;

  if not found then
    select * into v_draw from draws where week_start = v_week;
    return v_draw;
  end if;
  insert into draw_secrets (draw_id, seed) values (v_draw.id, v_seed);
  return v_draw;
end $$;

create function public._rollover(p_amount numeric, p_note text, p_now timestamptz) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_amount > 0 then
    insert into pot_contributions (draw_id, source, amount, note)
    values ((_ensure_draw_for(p_now)).id, 'rollover', p_amount, p_note);
  end if;
end $$;

create function public._forfeit_prize(p_draw_id uuid, p_now timestamptz) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_amount numeric;
  v_week date;
begin
  update winners set status = 'forfeited'
  where draw_id = p_draw_id and status in ('pending', 'claimed', 'verified')
  returning amount into v_amount;
  if not found then return false; end if;
  select week_start into v_week from draws where id = p_draw_id;
  perform _rollover(v_amount, 'Unclaimed prize from ' || week_label(v_week), p_now);
  return true;
end $$;

-- Why a user can't enter right now, or null if they can.
create function public._entry_block(p_user uuid, p_draw public.draws, p_now timestamptz) returns text
language plpgsql stable security definer set search_path = public as $$
declare
  p profiles;
  s app_settings;
begin
  select * into p from profiles where id = p_user;
  select * into s from app_settings;
  if p.id is null then return 'needs_profile'; end if;
  if p.banned_at is not null then return 'banned'; end if;
  if p.display_name is null or p.country_code is null or p.confirmed_adult_at is null
     or p.accepted_rules_version is distinct from s.rules_version then
    return 'needs_profile';
  end if;
  if p.country_code = any (s.excluded_countries) then return 'excluded_country'; end if;
  if p_draw.status <> 'open' or p_now < p_draw.opens_at or p_now >= p_draw.closes_at then
    return 'draw_closed';
  end if;
  return null;
end $$;

-- ------------------------------------------------------------
-- Public reads (anon + signed in)
-- ------------------------------------------------------------
create function public.draw_view(p_draw_id uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'draw', to_jsonb(d),
    'pot', pot_summary(d.id),
    'entries', coalesce(d.total_entries, (select count(*) from entries e where e.draw_id = d.id)),
    'sponsor', (select jsonb_build_object('id', s.id, 'name', s.name, 'url', s.url, 'tagline', s.tagline)
                from sponsors s where s.id = d.sponsor_id),
    'winner', (select jsonb_build_object('name', coalesce(p.display_name, 'Former member'),
                                         'country', p.country_code, 'status', w.status)
               from winners w left join profiles p on p.id = w.user_id where w.draw_id = d.id))
  from draws d where d.id = p_draw_id
$$;

create function public.home_data() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_current draws := _ensure_draw_for(now());
  v_last uuid;
begin
  select id into v_last from draws where status = 'drawn' order by week_start desc limit 1;
  return jsonb_build_object(
    'current', draw_view(v_current.id),
    'last', case when v_last is null then null else draw_view(v_last) end);
end $$;

create function public.past_draws(p_limit integer default 52) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(draw_view(id) order by week_start desc), '[]'::jsonb)
  from (select id, week_start from draws where status = 'drawn'
        order by week_start desc limit least(p_limit, 520)) d
$$;

-- The ordered entry list behind a draw's result. Published once drawn.
create function public.draw_entry_ids(p_draw_id uuid) returns uuid[]
language sql stable security definer set search_path = public as $$
  select case when (select status from draws where id = p_draw_id) = 'drawn'
    then coalesce((select array_agg(id order by created_at, id) from entries where draw_id = p_draw_id), '{}')
  end
$$;

-- ------------------------------------------------------------
-- Signed-in users
-- ------------------------------------------------------------
create function public.my_status() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_draw draws;
  p profiles;
begin
  if v_uid is null then return null; end if;
  select * into p from profiles where id = v_uid;
  if p.id is null then return null; end if;
  v_draw := _ensure_draw_for(now());
  return jsonb_build_object(
    'profile', jsonb_build_object('email', p.email, 'display_name', p.display_name,
                                  'country_code', p.country_code),
    'is_admin', p.is_admin and p.banned_at is null,
    'draw_id', v_draw.id,
    'week_start', v_draw.week_start,
    'block', _entry_block(v_uid, v_draw, now()),
    'entries', (select count(*) from entries where draw_id = v_draw.id and user_id = v_uid),
    'entered_today', exists (select 1 from entries where draw_id = v_draw.id and user_id = v_uid
                             and entry_date = (now() at time zone 'UTC')::date),
    'my_entry_ids', (select coalesce(jsonb_agg(id order by created_at), '[]') from entries
                     where draw_id = v_draw.id and user_id = v_uid),
    'winnings', (select coalesce(jsonb_agg(jsonb_build_object(
                    'draw_id', w.draw_id, 'week_start', d.week_start, 'amount', w.amount,
                    'currency', w.currency, 'status', w.status, 'claim_deadline', w.claim_deadline)
                  order by w.created_at desc), '[]')
                 from winners w join draws d on d.id = w.draw_id where w.user_id = v_uid));
end $$;

create function public.my_entry_ids(p_draw_id uuid) returns uuid[]
language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(id order by created_at), '{}') from entries
  where draw_id = p_draw_id and user_id = auth.uid()
$$;

create function public.save_profile(
  p_display_name text, p_country_code text, p_confirm_adult boolean, p_accept_rules boolean
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_name text := btrim(p_display_name);
  p profiles;
begin
  if v_uid is null then raise exception 'Sign in first.'; end if;
  if v_name is null or length(v_name) < 2 or length(v_name) > 40 then
    raise exception 'Enter a name of 2 to 40 characters.';
  end if;
  if p_country_code is null or p_country_code !~ '^[A-Z]{2}$' then
    raise exception 'Choose your country of residence.';
  end if;
  if not coalesce(p_confirm_adult, false) then raise exception 'You must be 18 or older.'; end if;
  if not coalesce(p_accept_rules, false) then raise exception 'Accept the official rules to continue.'; end if;

  select * into p from profiles where id = v_uid;
  if p.id is null then raise exception 'Profile not found.'; end if;
  if p.country_code is not null and p.country_code <> p_country_code then
    raise exception 'Contact support to change your country of residence.';
  end if;

  update profiles set
    display_name = v_name,
    country_code = p_country_code,
    confirmed_adult_at = coalesce(confirmed_adult_at, now()),
    accepted_rules_version = (select rules_version from app_settings)
  where id = v_uid;
end $$;

create function public.enter_draw() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_draw draws;
  v_block text;
  v_new boolean;
begin
  if v_uid is null then raise exception 'Sign in first.'; end if;
  v_draw := _ensure_draw_for(now());
  v_block := _entry_block(v_uid, v_draw, now());
  if v_block is not null then raise exception using message = v_block, errcode = 'P0001', hint = 'entry_block'; end if;

  insert into entries (draw_id, user_id, entry_date)
  values (v_draw.id, v_uid, (now() at time zone 'UTC')::date)
  on conflict (draw_id, user_id, entry_date) do nothing;
  v_new := found;

  return jsonb_build_object(
    'entered', v_new,
    'entries', (select count(*) from entries where draw_id = v_draw.id and user_id = v_uid));
end $$;

create function public.claim_prize(p_draw_id uuid, p_legal_name text, p_payout_details text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in first.'; end if;
  if length(btrim(coalesce(p_legal_name, ''))) < 2 then raise exception 'Enter your full legal name.'; end if;
  if length(btrim(coalesce(p_payout_details, ''))) < 5 then
    raise exception 'Tell us where to send the prize (e.g. your PayPal email).';
  end if;
  update winners set
    status = 'claimed',
    legal_name = left(btrim(p_legal_name), 120),
    payout_details = left(btrim(p_payout_details), 500),
    claimed_at = now()
  where draw_id = p_draw_id and user_id = auth.uid() and status = 'pending' and claim_deadline > now();
  if not found then raise exception 'This prize can''t be claimed (already claimed or expired).'; end if;
end $$;

-- ------------------------------------------------------------
-- Admins
-- ------------------------------------------------------------
create function public._require_admin() returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Admins only.'; end if;
end $$;

create function public.admin_overview() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_draw draws;
begin
  perform _require_admin();
  v_draw := _ensure_draw_for(now());
  return jsonb_build_object(
    'current', draw_view(v_draw.id),
    'winners', (select coalesce(jsonb_agg(jsonb_build_object(
        'draw_id', w.draw_id, 'week_start', d.week_start, 'amount', w.amount, 'currency', w.currency,
        'status', w.status, 'legal_name', w.legal_name, 'payout_details', w.payout_details,
        'payout_reference', w.payout_reference, 'claim_deadline', w.claim_deadline,
        'email', p.email, 'display_name', p.display_name, 'country_code', p.country_code)
      order by w.created_at desc), '[]')
      from winners w join draws d on d.id = w.draw_id left join profiles p on p.id = w.user_id));
end $$;

-- For 'ads', p_amount is gross ad revenue; the published share goes in.
create function public.admin_add_contribution(p_source text, p_amount numeric, p_note text) returns numeric
language plpgsql security definer set search_path = public as $$
declare
  v_draw draws;
  s app_settings;
  v_amount numeric;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  perform _require_admin();
  if p_source not in ('sponsor', 'ads') then raise exception 'Source must be sponsor or ads.'; end if;
  if p_amount is null or p_amount <= 0 or p_amount > 10000000 then raise exception 'Enter a positive amount.'; end if;
  select * into s from app_settings;
  v_draw := _ensure_draw_for(now());
  if v_draw.status <> 'open' then raise exception 'Money can only be added to an open draw.'; end if;

  if p_source = 'ads' then
    v_amount := floor(p_amount * s.ad_share_percent) / 100;
    v_note := concat_ws(' · ',
      trim_scale(s.ad_share_percent)::text || '% of ' || s.currency || ' ' ||
        to_char(p_amount, 'FM999999990.00') || ' ad revenue',
      v_note);
  else
    v_amount := round(p_amount, 2);
  end if;
  if v_amount <= 0 then raise exception 'Amount is too small.'; end if;

  insert into pot_contributions (draw_id, source, amount, note)
  values (v_draw.id, p_source, v_amount, left(v_note, 200));
  return v_amount;
end $$;

create function public.admin_set_sponsor(p_name text, p_url text, p_tagline text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  perform _require_admin();
  if length(btrim(coalesce(p_name, ''))) = 0 then raise exception 'Enter the sponsor name.'; end if;
  if nullif(btrim(coalesce(p_url, '')), '') is not null and p_url !~ '^https?://' then
    raise exception 'The sponsor URL must start with http:// or https://';
  end if;
  insert into sponsors (name, url, tagline)
  values (left(btrim(p_name), 80), nullif(btrim(coalesce(p_url, '')), ''), nullif(left(btrim(coalesce(p_tagline, '')), 120), ''))
  returning id into v_id;
  update draws set sponsor_id = v_id where id = (_ensure_draw_for(now())).id;
end $$;

create function public.admin_update_winner(p_draw_id uuid, p_status text, p_reference text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform _require_admin();
  if p_status = 'verified' then
    update winners set status = 'verified' where draw_id = p_draw_id and status = 'claimed';
  elsif p_status = 'paid' then
    if length(btrim(coalesce(p_reference, ''))) = 0 then raise exception 'Add the payout reference.'; end if;
    update winners set status = 'paid', payout_reference = left(btrim(p_reference), 200), paid_at = now()
    where draw_id = p_draw_id and status = 'verified';
  elsif p_status = 'forfeited' then
    if not _forfeit_prize(p_draw_id, now()) then raise exception 'Prize can''t be forfeited from its current state.'; end if;
    return;
  else
    raise exception 'Unknown status.';
  end if;
  if not found then raise exception 'Can''t mark as % from the current state.', p_status; end if;
end $$;

create function public.admin_set_ban(p_email text, p_banned boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform _require_admin();
  update profiles set banned_at = case when p_banned then now() end
  where email = lower(btrim(p_email));
  if not found then raise exception 'No account with that email.'; end if;
end $$;

-- ------------------------------------------------------------
-- Scheduled job (service role only)
-- ------------------------------------------------------------
create function public._sync_settings(
  p_excluded text[], p_ad_share numeric, p_rules_version text, p_currency text, p_admin_emails text[]
) returns void
language plpgsql security definer set search_path = public as $$
begin
  update app_settings set
    excluded_countries = coalesce(p_excluded, excluded_countries),
    ad_share_percent = coalesce(p_ad_share, ad_share_percent),
    rules_version = coalesce(p_rules_version, rules_version),
    currency = coalesce(p_currency, currency);
  if p_admin_emails is not null then
    update profiles set is_admin = (email = any (p_admin_emails))
    where is_admin is distinct from (email = any (p_admin_emails));
  end if;
end $$;

-- Opens this week's draw, closes finished ones, forfeits expired prizes,
-- and lists closed draws whose drand round is out.
create function public._lifecycle_prepare(p_now timestamptz) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_closed integer;
  v_forfeited integer := 0;
  r record;
begin
  perform _ensure_draw_for(p_now);
  update draws set status = 'closed' where status = 'open' and closes_at <= p_now;
  get diagnostics v_closed = row_count;

  for r in select draw_id from winners where status = 'pending' and claim_deadline < p_now loop
    if _forfeit_prize(r.draw_id, p_now) then v_forfeited := v_forfeited + 1; end if;
  end loop;

  return jsonb_build_object(
    'closed', v_closed,
    'forfeited', v_forfeited,
    'ready', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'round', randomness_round)
                                         order by closes_at), '[]')
              from draws where status = 'closed' and drand_round_time(randomness_round) <= p_now),
    'waiting', (select count(*) from draws where status = 'closed' and drand_round_time(randomness_round) > p_now));
end $$;

-- Reveals the seed, picks the winner, records the prize (or rolls over).
create function public._complete_draw(p_draw_id uuid, p_randomness text, p_now timestamptz) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  d draws;
  s app_settings;
  v_seed text;
  v_ids uuid[];
  v_users uuid[];
  v_total integer;
  v_index integer;
  v_pot numeric;
  v_winner profiles;
begin
  select * into d from draws where id = p_draw_id for update;
  if d.id is null then raise exception 'Draw not found.'; end if;
  if d.status <> 'closed' then raise exception 'Draw is %.', d.status; end if;
  if drand_round_time(d.randomness_round) > p_now then raise exception 'Beacon round not released yet.'; end if;
  if p_randomness is null or p_randomness !~ '^[0-9a-f]{64}$' then raise exception 'Invalid randomness.'; end if;

  select seed into v_seed from draw_secrets where draw_id = d.id;
  if v_seed is null or sha256_hex(v_seed) <> d.seed_hash then
    raise exception 'Secret seed missing or does not match the published hash.';
  end if;

  select * into s from app_settings;
  select array_agg(id order by created_at, id), array_agg(user_id order by created_at, id)
    into v_ids, v_users from entries where draw_id = d.id;
  v_total := coalesce(array_length(v_ids, 1), 0);
  v_pot := (pot_summary(d.id) ->> 'total')::numeric;

  if v_total = 0 then
    update draws set status = 'drawn', seed = v_seed, randomness = p_randomness,
      total_entries = 0, prize_amount = 0, drawn_at = p_now where id = d.id;
    perform _rollover(v_pot, 'Rolled over from ' || week_label(d.week_start) || ' (no entries)', p_now);
    return jsonb_build_object('status', 'rolled_over', 'amount', v_pot);
  end if;

  v_index := winner_index(v_seed, p_randomness, v_total);
  update draws set status = 'drawn', seed = v_seed, randomness = p_randomness,
    total_entries = v_total, winner_index = v_index, winning_entry_id = v_ids[v_index + 1],
    prize_amount = v_pot, drawn_at = p_now
  where id = d.id;

  if v_pot > 0 then
    insert into winners (draw_id, user_id, entry_id, amount, currency, claim_deadline)
    values (d.id, v_users[v_index + 1], v_ids[v_index + 1], v_pot, d.currency,
            p_now + make_interval(days => s.claim_window_days));
  end if;

  select * into v_winner from profiles where id = v_users[v_index + 1];
  return jsonb_build_object(
    'status', 'drawn', 'amount', v_pot, 'currency', d.currency, 'label', week_label(d.week_start),
    'winner_index', v_index, 'total_entries', v_total,
    'email', v_winner.email, 'display_name', v_winner.display_name,
    'claim_window_days', s.claim_window_days);
end $$;

-- ------------------------------------------------------------
-- Function permissions. Supabase grants EXECUTE broadly by default,
-- so revoke everything and grant back exactly what each role needs.
-- ------------------------------------------------------------
do $$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as sig from pg_proc p
    where p.pronamespace = 'public'::regnamespace
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
    execute format('grant execute on function %s to service_role', f.sig);
  end loop;
end $$;

grant execute on function
  public.home_data(), public.draw_view(uuid), public.past_draws(integer), public.draw_entry_ids(uuid),
  public.pot_summary(uuid), public.drand_round_at(timestamptz), public.drand_round_time(bigint),
  public.winner_index(text, text, integer), public.sha256_hex(text), public.week_label(date)
  to anon, authenticated;

grant execute on function
  public.my_status(), public.my_entry_ids(uuid), public.save_profile(text, text, boolean, boolean),
  public.enter_draw(), public.claim_prize(uuid, text, text), public.is_admin(),
  public.admin_overview(), public.admin_add_contribution(text, numeric, text),
  public.admin_set_sponsor(text, text, text), public.admin_update_winner(uuid, text, text),
  public.admin_set_ban(text, boolean)
  to authenticated;
