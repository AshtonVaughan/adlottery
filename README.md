# PLACEHOLDER_NAME

A production-quality MVP for a **global, web-first, free prize draw platform**.

This is **not** a casino, **not** betting, **not** wagering, **not** a paid
lottery, **not** a deposit product, and **not** crypto. Entry is always free —
prize pools are funded by the platform, sponsors, and (later) advertising.

> The brand name is configurable through `NEXT_PUBLIC_APP_NAME`,
> `src/lib/constants.ts`, metadata config, email templates, and legal-page
> placeholders. The repo does not hard-code a brand.

---

## V1 does

- Web sign-up, login, password reset (Supabase Auth)
- Server-side country hint from `x-vercel-ip-country` / `cf-ipcountry` headers — used to preselect, never to enforce
- Configurable jurisdiction engine (open / restricted / waitlist / blocked) covering USA, Canada, UK, Australia, NZ, Western Europe, Nordics, Eastern Europe, Japan, South Korea, LATAM, SEA, India, MENA out of the box
- Region availability page + per-country signup gating + waitlist capture
- Weekly free prize draw — full draft → active → locked → drawn → published lifecycle, including in-place edit of draft draws
- One free daily entry per eligible user per draw (server-enforced via a unique constraint on `(user_id, draw_id, claim_date)`)
- Referral system: code captured on signup, bonus entry awarded after the referred user's first valid daily claim
- Deterministic, verifiable winner selection with public seed + SHA-256 hash + randomness source committed in advance
- Public archive of completed draws with full fairness proof and region-aware winner display modes
- Winner claim workflow with identity-verification placeholder + skill-question support (Canada-style, India-style)
- Admin console: draws CRUD + lifecycle, jurisdictions editor, user ban/unban, winner claims review, fraud queue, audit log, sponsors, CSV export
- Audit log on every privileged action
- Fraud-flag heuristic (device-hash velocity); flags queue for manual review, no auto-ban
- Email-template module wired through the central brand constant so future Resend integration plugs in
- Premium dark-first responsive UI built on Geist Sans, shadcn-style primitives, and a refined color system (no casino visuals)
- 47 unit tests covering eligibility, deterministic draw, validation, referral, skill-question, self-referral, and daily-entry uniqueness

## V1 intentionally does **not** do

- No paid entries, deposits, subscriptions, or crypto
- No instant-win mechanics, scratch cards, or casino visuals
- No rewarded-ad entries (the flag exists, `ENABLE_REWARDED_AD_ENTRIES`, but is disabled and there is no entry source for it in V1)
- No native mobile app
- No legal advice rendered in-app (the legal pages are placeholders that must be reviewed by qualified counsel)

---

## Tech stack

- **Frontend / backend:** Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn-style primitives
- **Typography:** Geist Sans + Geist Mono via `next/font` (no CDN call)
- **Auth + DB:** Supabase Postgres + Supabase Auth with full RLS
- **Hosting:** Vercel (serverless functions, no filesystem persistence)
- **Validation:** Zod
- **Bot protection:** Cloudflare Turnstile placeholder (auto-bypassed in dev)
- **Email:** Resend placeholder + central email-template module
- **Identity:** Stripe Identity placeholder (winner verification UI button)
- **Payouts:** Manual Wise / Stripe payout status tracking in V1
- **Analytics:** PostHog-ready hook (no-op until configured)

---

## Run locally

```bash
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY /
# SUPABASE_SERVICE_ROLE_KEY at minimum.

npm install
npm run dev
```

The app boots at `http://localhost:3000`. The home page works without a
Supabase connection — the database-backed pages will render empty states.

### Tests / typecheck / lint

```bash
npm run typecheck
npm run lint
npm run test
```

---

## Configure Supabase

1. Create a new project at https://supabase.com.
2. Run the SQL in `supabase/migrations/0001_init.sql`,
   `0002_rls.sql` and `0003_draw_commitment.sql` in the SQL editor (in that order). If you
   have the Supabase CLI:

   ```bash
   supabase db push
   ```

3. Load the seed data:

   ```sql
   -- In the Supabase SQL editor:
   \i supabase/seed.sql
   ```

   This seeds the jurisdiction table, an active weekly draw, a completed
   archived draw, a sample sponsor, and a sample skill question.

4. In **Authentication → Providers**, enable email/password. For local dev you
   can disable email confirmations; in production keep them on.

5. Set up an admin user:

   ```sql
   -- After signing up via the app:
   update profiles
   set is_admin = true
   where email = 'YOUR_EMAIL';
   ```

   Or include the email in `ADMIN_EMAILS` (comma-separated) so the signup
   endpoint flips the bit automatically.

---

## Deploy to Vercel

1. Push the repo to GitHub.
2. Import the repo in Vercel.
3. Add the environment variables listed in `.env.example` to the Vercel
   project — including `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (server-only).
4. **Do not** expose `SUPABASE_SERVICE_ROLE_KEY` to the browser. Vercel
   automatically scopes server-only env vars; never prefix it with `NEXT_PUBLIC_`.
5. Hit Deploy. Vercel detects Next.js automatically; the included
   `vercel.json` is intentionally minimal.

---

## Environment variables

See [`.env.example`](./.env.example). Highlights:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_NAME` | Brand name shown everywhere (rebrand by changing this) |
| `NEXT_PUBLIC_APP_URL` | Base URL used in metadata, referral links, password reset |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe Supabase keys |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only.** Bypasses RLS for trusted server logic |
| `ADMIN_EMAILS` | Comma-separated list; signup endpoint auto-marks these emails as admin |
| `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile bot protection (verification is skipped if unset for dev) |
| `RESEND_API_KEY` | Placeholder for transactional email |
| `POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_KEY` | Optional analytics |
| `ENABLE_SPONSORSHIPS` | Defaults `true` |
| `ENABLE_AD_CONFIG` | Defaults `false`. Ad provider configuration table is exposed to admin only |
| `ENABLE_REWARDED_AD_ENTRIES` | Defaults `false` and **not used** by V1. Reserved for a future, compliance-reviewed flow |
| `DEFAULT_CURRENCY` | Default fallback currency |

---

## Jurisdiction engine

`jurisdictions` (one row per country) is the source of truth for everything
country-specific. Server logic in `src/lib/jurisdictions.ts` evaluates:

- Eligibility on signup
- Whether a user can enter a given draw with a given entry source
- Which entry methods are allowed/blocked in a country
- The winner display mode (`full | partial | anonymous`) in the public archive
- Whether the winner claim workflow includes a skill question

Each jurisdiction also stores a permit threshold, prize cap, KYC requirement,
terms/privacy/draw-rules version, and free-text notes for compliance review.

The seed data ships with representative configurations for:

USA, Canada (skill-question region), UK, Australia, NZ, Western Europe,
Nordics, Eastern Europe (Poland), Japan, South Korea, LATAM (Brazil
restricted, Mexico open, Argentina restricted), SEA (SG, PH, MY, ID),
India (skill-based), MENA (AE restricted; SA, KW, IR blocked).

---

## Draw process

1. Admin creates a draft draw (title, type, prize, currency, eligible
   countries, window).
2. Admin activates it. The server generates a secret 32-byte seed
   (stored in `draw_seed_secrets`, service-role only) and publishes
   `public_seed_hash = sha256(seed)` plus a future **drand quicknet round**
   (`randomness_round`) released ~60s after `ends_at`. Entries can now be
   claimed. Draws activated before this existed get their commitment on lock.
3. At the end of the window, admin locks the draw (no more entries accepted).
4. Once the beacon round is released, admin clicks **Run draw** — no input.
   The server fetches the round from drand (checking
   `randomness = sha256(signature)`), loads **all** entries in pages of
   1000 sorted by `(created_at, id)`, and computes:

   ```
   winner_index = sha256(seed + "|" + drand_randomness) mod total_entries
   ```

5. The seed is revealed. Seed, hash, beacon round, randomness, winning entry
   and total entries are surfaced in the public archive so anyone can verify
   the seed matches its pre-published hash and re-run the math.
6. A `winner_claims` row is created. If the winner's jurisdiction requires a
   skill question, claim status starts at `skill_question_required`;
   otherwise it starts at `verification_required`.

Neither the operator (seed fixed before entries, hash public) nor the
beacon (value unknown until after entries close) can choose the winner.

Every step is recorded in `audit_logs`.

---

## Winner claim workflow

- Winner sees a private claim page at `/winner/[id]`.
- They start identity verification (Stripe Identity placeholder).
- If their jurisdiction requires a skill question, they submit an answer.
  Correct answers move the claim to `verification_required`; incorrect
  answers move it to `rejected`.
- Admin updates claim status and payout status (`not_started → pending →
  paid | failed | cancelled`) in `/admin/claims`, with optional payout
  reference (e.g. Wise transaction id).

---

## Fraud controls

- `entries.ip_hash` and `entries.device_hash` are server-salted SHA-256 only.
- The claim endpoint creates a `fraud_flags` row when more than four claims
  share a device hash in 24h.
- Fraud flags **do not auto-ban**. They queue in `/admin/fraud` for review and
  promotion to `confirmed` (manual follow-up) or `dismissed`.

---

## Security

- `SUPABASE_SERVICE_ROLE_KEY` is server-only. All entry writes go through the
  service-role client; clients cannot insert entries directly.
- Row Level Security is enabled on every table. Users can read their own
  rows; admins can read and write everything; everyone can read public draw
  data and active jurisdictions.
- Every privileged action is recorded in `audit_logs` with the actor user id.
- Inputs are validated with Zod schemas in `src/lib/validation.ts`.
- The signup, claim, and waitlist endpoints have an in-process rate limiter
  placeholder — replace with Upstash/Redis before public traffic.
- Cloudflare Turnstile placeholder: drop in a site key + secret and the
  signup/claim endpoints will verify automatically.
- No raw IP storage — only hashes for fraud heuristics.

---

## Legal documents

Seven versioned drafts live under `/legal/*`:

| Route | Document | Version |
| --- | --- | --- |
| `/legal/terms` | Terms &amp; Conditions | `LEGAL_VERSIONS.terms` |
| `/legal/privacy` | Privacy Policy | `LEGAL_VERSIONS.privacy` |
| `/legal/draw-rules` | Draw Rules (entry methods, fairness method, claim flow) | `LEGAL_VERSIONS.drawRules` |
| `/legal/responsible-participation` | Responsible Participation | `LEGAL_VERSIONS.terms` |
| `/legal/fraud-policy` | Fraud &amp; Multi-Account Policy | `LEGAL_VERSIONS.terms` |
| `/legal/regional-eligibility` | Regional Eligibility Rules | `LEGAL_VERSIONS.terms` |
| `/legal/no-purchase-required` | No Purchase Required | `LEGAL_VERSIONS.drawRules` |

These are real **drafts** — substantive copy that reflects the product's
design — wrapped in a clearly visible "Draft placeholder" banner. They are
**not legal advice** and must be reviewed, region-by-region, by qualified
counsel before any public launch. Per-region adjustments belong in the
`jurisdictions` table (terms_version, privacy_version, draw_rules_version)
and in the document copy itself.

Bump `LEGAL_VERSIONS` in `src/lib/constants.ts` whenever the legal copy
materially changes; signup records the accepted versions on the profile so
you can prompt re-acceptance after a bump.

## Design system

- **Fonts:** Geist Sans + Geist Mono, loaded via `next/font` with no external request.
- **Color tokens:** HSL custom properties in `src/app/globals.css` — emerald primary `152 76% 56%`, neutral background `240 6% 6%`. Adjust there to rebrand visually.
- **Motion:** subtle hover and active-press transitions on primary surfaces. No bouncing, no parallax, no carousel.
- **Iconography:** Lucide. Use sparingly — one icon per section header, never decorative.
- **Stats:** monospace tabular figures via the `.stat` utility for any number that updates (entries, countdowns, prize amounts).
- **Layout primitives:** `Card`, `Button`, `Badge`, `Input`, `Select`, `Textarea`, `Checkbox`, `Label`, `BrandMark`, `Countdown`, `DrawCard`. All under `src/components/ui` or `src/components`.

---

## Future monetisation notes

- **Sponsorships** are first-class today (`sponsors` table, `sponsored_draw`
  type, sponsor name + URL on each draw).
- **Advertising** is supported as configuration only via `ad_config`,
  surfaced to admins behind `ENABLE_AD_CONFIG`.
- **Rewarded-ad entries** are intentionally absent from V1 — the entry source
  enum does not include them. If/when compliance approves, add a migration
  for a new `rewarded_ad_entry` source and flip `ENABLE_REWARDED_AD_ENTRIES`.

---

## What remains before public launch

- Real legal review by qualified counsel for every region.
- Replace placeholder Turnstile / Resend / Stripe Identity integrations with
  configured production credentials.
- Replace the in-process rate limiter with a durable store (Upstash/Redis).
- Optionally verify drand BLS signatures server-side (today only
  `randomness = sha256(signature)` is checked; the round is public so anyone
  can verify fully).
- Replace the static skill question with a per-region pool.
- Wire up email notifications (Resend) for: winner-claim, claim-status
  changes, payout updates, waitlist invites.
- Add full end-to-end tests against a Supabase test branch.
- Run a security review of RLS policies against the real schema.
- Operational runbooks for fraud review, payout, and dispute handling.
