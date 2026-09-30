-- ============================================================
-- Commit-reveal draw fairness
--
-- At activation the server generates a secret seed and publishes only
-- its SHA-256 hash (draws.public_seed_hash), together with a future
-- drand beacon round (draws.randomness_round) that is released after
-- entries close. At run time the seed is revealed and combined with
-- the beacon output, so neither the operator nor the beacon alone
-- can choose the winner.
-- ============================================================

alter table public.draws
  add column if not exists randomness_round bigint null,
  add column if not exists seed_committed_at timestamptz null;

-- Secret seeds live outside `draws`, which is publicly readable.
-- RLS is enabled with no policies: only the service role can read or
-- write this table.
create table if not exists public.draw_seed_secrets (
  draw_id uuid primary key references public.draws(id) on delete cascade,
  seed text not null,
  created_at timestamptz not null default now()
);

alter table public.draw_seed_secrets enable row level security;
