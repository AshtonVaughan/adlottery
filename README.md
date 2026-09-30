# The Weekly Pot

One free weekly draw. Sponsors and ad revenue fill the pot, one person wins all of it every Monday, and anyone can check the draw was fair.

The name is a placeholder: set `NEXT_PUBLIC_APP_NAME`.

## How it works

| | |
| --- | --- |
| **Enter** | Sign in with an emailed link, then one free entry per UTC day (up to 7 a week). Nobody ever pays, and nobody has to view or click an ad. |
| **Pot** | A public ledger per draw: sponsor money, `NEXT_PUBLIC_AD_SHARE_PERCENT`% (default 50) of gross ad revenue, and rollovers. |
| **Week** | Monday 00:00 UTC to the next Monday 00:00 UTC. |
| **Draw** | Automatic. A daily Vercel Cron job (`/api/cron/lifecycle`, 00:05 UTC) opens this week's draw, closes last week's, draws the winner and expires unclaimed prizes. |
| **Claim** | The winner claims on `/account` within 30 days. Admin verifies ID and marks the prize paid. Unclaimed or forfeited prizes, and pots from weeks with no entries, roll into the current pot. |

### Fairness

When a draw is created, the server generates a secret 32-byte seed, stores it where only the server can read it (`draw_secrets`), and publishes:

- `seed_hash = sha256(seed)`
- a future [drand](https://drand.love) quicknet round, released about 60 seconds after the draw closes

After that round is out, the winner is:

```
winner_index = sha256(seed + "|" + drand_randomness) mod total_entries   (first 52 bits)
```

Entries are ordered by `(created_at, id)`. The draw page then reveals the seed and randomness, and links the ordered entry list (`/draws/<id>/entries.txt`), so anyone can re-run it. Nobody sees the admin in this process: no one types a seed, and the operator can't change the seed once its hash is public. The beacon value isn't known until after entries close.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Without Supabase keys the site runs in **demo mode**: sample data, with sign-in and entries turned off. This is handy for previewing a Vercel deploy before the database exists.

## Go live

1. Create a Supabase project. Run `supabase/migrations/0001_schema.sql` in the SQL editor. `supabase/seed.sql` is optional.
2. In Supabase Auth, enable email sign-in and add `<your-url>/auth/callback` to the redirect URLs.
3. On Vercel, set the env vars from `.env.example`. At minimum: the three Supabase keys, `NEXT_PUBLIC_APP_URL`, `ADMIN_EMAILS` and `CRON_SECRET`.
4. Deploy. The cron is defined in `vercel.json`. The first page view also creates this week's draw.
5. Each week in `/admin`: set the sponsor, add their money, and add ad revenue as it comes in (enter the gross amount; the published share goes in).

Ads use Google AdSense via `NEXT_PUBLIC_ADSENSE_CLIENT` and `NEXT_PUBLIC_ADSENSE_SLOT`. Without them, placeholder boxes are shown.

## GitHub Pages preview

GitHub Pages can only serve fixed files, so it can't run the real app (it needs a server for the secret draw seeds, entries and the weekly cron). `.github/workflows/pages.yml` publishes a **static, demo-data preview** instead, which is useful for sharing the design:

1. Repo **Settings → Pages → Source: GitHub Actions**. Pages on a private repo needs a paid GitHub plan; otherwise make the repo public.
2. Merge to `main`, or run the "Pages preview" workflow by hand. It rebuilds every Monday so the demo dates stay current.
3. The preview is at `https://<user>.github.io/adlottery/`.

To build it locally: `PAGES_BASE_PATH=/adlottery npm run build && node scripts/export-pages.mjs`, which writes to `out/`.

## Code map

- `src/lib/draw.ts` handles the lifecycle: create with commitment, close, draw, rollover, forfeit.
- `src/lib/drand.ts` and `drand-server.ts` hold the beacon round maths and fetching (checks `randomness = sha256(signature)`).
- `src/lib/eligibility.ts` decides who can enter.
- `src/lib/pot.ts` sums the ledger and calculates the ad share.
- `src/lib/data.ts` does page reads, plus demo data.
- `src/app/` holds the pages and `api/` routes. All writes go through the server with the service-role key; row-level security gives clients read-only access to public or their own rows.
- `tests/` includes a full lifecycle run against an in-memory Supabase fake that enforces the 1,000-row page limit.

```bash
npm run typecheck && npm run lint && npm test
```

## Before launch (not legal advice)

- **Global launch:** prize-promotion law differs by country. Have counsel review `/rules`, `/privacy` and `NEXT_PUBLIC_EXCLUDED_COUNTRIES` (default: comprehensively sanctioned countries). Some countries require registration or permits above certain prize values.
- **Consent:** cookie/ad consent (a CMP) is required for AdSense in the EU/UK.
- **Multiple accounts** are the main abuse risk. The defence today is ID verification before payout plus one prize per person. Add Cloudflare Turnstile to `/api/enter` if bot sign-ups appear.
- **Account deletion:** add a self-serve flow. Entries are designed to survive it anonymously (`user_id` becomes null), so past proofs stay valid.
