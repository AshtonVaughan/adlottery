-- ============================================================
-- Weekly pot: one free weekly draw funded by sponsors and ads.
--
-- Money in:  pot_contributions (sponsor | ads | rollover), public ledger
-- Tickets:   entries, one per user per UTC day per draw
-- Fairness:  draws.seed_hash + draws.randomness_round are published when
--            the draw is created; the seed (kept in draw_secrets) and the
--            drand output are revealed when it is drawn.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ------------------------------------------------------------
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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- sponsors
-- ------------------------------------------------------------
create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text null,
  tagline text null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- draws (one per ISO week, Monday 00:00 UTC to next Monday 00:00 UTC)
-- ------------------------------------------------------------
create table public.draws (
  id uuid primary key default gen_random_uuid(),
  week_start date not null unique,
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  status text not null default 'open'
    check (status in ('open', 'closed', 'drawn', 'cancelled')),
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

create index draws_status_idx on public.draws(status);

-- Secret seeds stay out of the publicly readable draws table.
create table public.draw_secrets (
  draw_id uuid primary key references public.draws(id) on delete cascade,
  seed text not null
);

-- ------------------------------------------------------------
-- pot_contributions: the public money ledger
-- ------------------------------------------------------------
create table public.pot_contributions (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws(id) on delete cascade,
  source text not null check (source in ('sponsor', 'ads', 'rollover')),
  amount numeric(12, 2) not null check (amount > 0),
  note text null,
  created_at timestamptz not null default now()
);

create index pot_contributions_draw_idx on public.pot_contributions(draw_id);

-- ------------------------------------------------------------
-- entries: one per user per UTC day per draw
-- user_id is nulled (not deleted) on account deletion so a drawn
-- draw's entry list, and therefore its proof, never changes.
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- winners: claim + payout tracking
-- ------------------------------------------------------------
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

-- ============================================================
-- Row level security
-- All writes go through the server (service role). Clients may read
-- public draw data and their own rows only.
-- ============================================================
alter table public.profiles          enable row level security;
alter table public.sponsors          enable row level security;
alter table public.draws             enable row level security;
alter table public.draw_secrets      enable row level security;
alter table public.pot_contributions enable row level security;
alter table public.entries           enable row level security;
alter table public.winners           enable row level security;

create policy profiles_read_own on public.profiles
  for select using (auth.uid() = id);

create policy sponsors_read_all on public.sponsors
  for select using (true);

create policy draws_read_all on public.draws
  for select using (true);

create policy pot_contributions_read_all on public.pot_contributions
  for select using (true);

create policy entries_read_own on public.entries
  for select using (auth.uid() = user_id);

create policy winners_read_own on public.winners
  for select using (auth.uid() = user_id);

-- draw_secrets: no policies; service role only.
