# The Weekly Pot

One free weekly draw. Sponsors and ad revenue fill the pot, one person wins all of it every Monday, and anyone can check the draw was fair.

The name is a placeholder: set the `APP_NAME` variable.

## How it runs

The site is **fully static on GitHub Pages**. There's no server of its own:

| Piece | Where | Does |
| --- | --- | --- |
| Website | GitHub Pages (`.github/workflows/pages.yml`) | Static Next.js export. Talks to Supabase from the browser with the public anon key. |
| Rules and data | Supabase (`supabase/migrations/0001_schema.sql`) | Sign-in by email link. Every rule (who can enter, one entry a day, claims, admin actions) is a Postgres function; row-level security keeps tables read-only or owner-only. |
| Weekly draw | GitHub Actions, hourly (`.github/workflows/lifecycle.yml`) | Closes finished draws, fetches the drand beacon, picks the winner, emails them, rolls over expired prizes. Uses the service-role key, which never reaches the browser. |

### How it works for players

- **Enter:** sign in with an email link, then one free entry per UTC day (up to 7 a week). Nobody pays or has to view an ad.
- **Pot:** a public ledger of sponsor money, `AD_SHARE_PERCENT`% (default 50) of gross ad revenue, and rollovers.
- **Week:** Monday 00:00 UTC to the next Monday 00:00 UTC. The winner is drawn within about an hour of the close.
- **Claim:** within 30 days on `/account/`. Admin verifies ID and marks it paid. Unclaimed prizes, and pots from weeks with no entries, roll into the current pot.

### Fairness

When a draw is created, Postgres generates a secret seed, stored where no client can read it (`draw_secrets`), and publishes `sha256(seed)` plus a future [drand](https://drand.love) round released about 60 seconds after the close. Once that round is out:

```
winner_index = first 52 bits of sha256(seed + "|" + drand_randomness) mod total_entries
```

Entries are ordered by `(created_at, id)`. The draw page reveals the seed and randomness, offers the ordered entry list for download, and shows code to re-check it. Nobody types anything into the draw.

## Set it up

1. **Supabase:** create a project. Run `supabase/migrations/0001_schema.sql` in the SQL editor.
   - Under Authentication → URL configuration, set the Site URL to `https://<user>.github.io/<repo>/` and add `https://<user>.github.io/<repo>/auth/callback/` to the redirect URLs.
2. **GitHub → Settings → Pages:** set Source to "GitHub Actions". Pages on a private repo needs a paid plan; otherwise make the repo public.
3. **GitHub → Settings → Secrets and variables → Actions:**
   - Variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (both public). Optional: `APP_NAME`, `CURRENCY`, `AD_SHARE_PERCENT`, `EXCLUDED_COUNTRIES`, `SPONSOR_CONTACT`, `ADSENSE_CLIENT`, `ADSENSE_SLOT`.
   - Secrets: `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS` (comma-separated). Optional: `RESEND_API_KEY`, `EMAIL_FROM`.
4. Push to `main`, or run "Deploy site" from the Actions tab. After changing variables, re-run it so the site picks them up.
5. Sign in on the site with an `ADMIN_EMAILS` address, then run "Draw lifecycle" once from the Actions tab so the job marks you as admin. `/admin/` then lets you add sponsor money and ad revenue, set the week's sponsor, and handle payouts.

Without the Supabase variables, the site deploys in **demo mode** with sample data.

**Keep-alive notes.**
- GitHub pauses scheduled workflows after 60 days with no repo activity. Re-enable "Draw lifecycle" in the Actions tab if that happens.
- The hourly job also keeps a free Supabase project from pausing.

## Run it all locally

No accounts or keys needed. One command runs the site plus a real local database:

```bash
npm install
npm run local        # then open http://localhost:3000
```

- **Sign-in is instant:** any email works, with no email sent. Use `admin@example.com` to get the admin page.
- **Admin page:** add sponsor money and ad revenue and set a sponsor. In local mode it also has a **Draw now** button that ends the week immediately and picks the winner with a live drand round, so you can play through a whole week in a minute.
- **Data** is kept in `.local-db/`. Delete that folder to start over.

This runs `scripts/local-backend.ts`, which serves the real migration from PGlite (Postgres in WebAssembly) behind a Supabase-shaped API. It skips authentication, so it's for your own machine only.

## Develop

```bash
cp .env.example .env.local   # optional; empty = demo mode
npm install
npm run dev
npm run typecheck && npm run lint && npm test
```

`npm test` loads the real migration into [PGlite](https://pglite.dev) (Postgres in WebAssembly) and runs every rule against it:
- the SQL winner-index, hash, drand-round and week-label maths match the TypeScript copies;
- nobody else can call the internal functions;
- entering, profiles, claims and admin actions follow the rules;
- the full weekly cycle works, including a draw with more than 1,000 entries.

## Code map

- `supabase/migrations/0001_schema.sql` has every rule: tables, row-level security and functions.
- `src/lib/lifecycle.ts` and `scripts/lifecycle.ts` make up the hourly job.
- `src/lib/drand*.ts` holds the beacon round maths and fetching, including the `randomness = sha256(signature)` check.
- `src/lib/queries.ts` has the browser calls, plus demo data in `demo.ts`.
- `src/app/` holds the pages, all static and client-rendered: `/`, `/draw/?id=`, `/results/`, `/login/`, `/auth/callback/`, `/account/`, `/admin/`, `/rules/`, `/privacy/`.

## Before launch (not legal advice)

- Prize-promotion law differs by country. Have counsel review `/rules/`, `/privacy/` and `EXCLUDED_COUNTRIES`.
- A cookie/ad consent banner is required for AdSense in the EU and UK.
- Multiple accounts are the main abuse risk. The defence is ID verification before payout. Enable CAPTCHA in Supabase Auth if bot sign-ups appear.
- Add self-serve account deletion. Entries survive it anonymously, so past proofs stay valid.
