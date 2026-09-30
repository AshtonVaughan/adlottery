"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { claimPrize, saveProfile } from "@/lib/queries";
import { COUNTRIES, countryName, isCountryCode } from "@/lib/countries";
import { EXCLUDED_COUNTRIES, MIN_AGE } from "@/lib/config";
import { weekLabel } from "@/lib/week";
import { formatMoney, formatUtc } from "@/lib/utils";
import type { WinnerStatus } from "@/lib/types";

const STATUS_TEXT: Record<WinnerStatus, string> = {
  pending: "Waiting for your claim",
  claimed: "Claim received, verifying",
  verified: "Verified, payment on its way",
  paid: "Paid",
  forfeited: "Expired, rolled into a later pot",
};

export default function AccountPage() {
  const router = useRouter();
  const { demo, ready, session, me, refresh, signOut } = useAuth();
  const signingOut = useRef(false);

  useEffect(() => {
    if (ready && !session && !signingOut.current) router.replace(demo ? "/" : "/login/");
  }, [ready, session, demo, router]);

  if (!ready || !session) return <div className="container max-w-2xl py-14"><div className="card h-48 animate-pulse" /></div>;
  if (!me) return <div className="container max-w-2xl py-14 text-muted">Couldn&apos;t load your account. Try refreshing.</div>;

  if (me.block === "needs_profile") {
    return (
      <div className="container max-w-lg py-14">
        <p className="eyebrow">Almost there</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Finish signing up</h1>
        <p className="mt-2 text-muted">We need this once so we can pay you if you win.</p>
        <div className="mt-8">
          <ProfileForm
            defaultName={me.profile.display_name ?? ""}
            defaultCountry={me.profile.country_code ?? ""}
            countryLocked={Boolean(me.profile.country_code)}
            onSaved={async () => {
              await refresh();
              router.push("/");
            }}
          />
        </div>
      </div>
    );
  }

  const toClaim = me.winnings.filter((w) => w.status === "pending" && new Date(w.claim_deadline) > new Date());

  return (
    <div className="container max-w-2xl space-y-8 py-14">
      <div>
        <p className="eyebrow">Your account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Hi, {me.profile.display_name}</h1>
        <p className="mt-1 text-sm text-muted">
          {me.profile.email} · {countryName(me.profile.country_code ?? "")}
        </p>
      </div>

      {toClaim.map((w) => (
        <div key={w.draw_id} className="ticket rounded-2xl bg-accent p-6 text-accent-ink sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em]">You won · {weekLabel(w.week_start)}</p>
          <p className="num mt-2 text-5xl font-semibold tracking-tight">{formatMoney(w.amount, w.currency, true)}</p>
          <p className="mt-2 text-sm opacity-70">Claim by {formatUtc(w.claim_deadline)}.</p>
          <div className="mt-6">
            <ClaimForm drawId={w.draw_id} onDone={refresh} />
          </div>
        </div>
      ))}

      <div className="card p-6">
        <p className="eyebrow">{weekLabel(me.week_start)}</p>
        <p className="mt-2 text-xl font-semibold">
          <span className="num">{me.entries}</span> of 7 possible entries this week
        </p>
        <div className="mt-4 flex gap-1.5" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} className={`h-2 flex-1 rounded-full ${i < me.entries ? "bg-accent" : "bg-line"}`} />
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">
          {me.entered_today ? "You've entered today. Come back tomorrow for another." : "You haven't entered today."}{" "}
          <Link href="/" className="font-medium text-ink underline underline-offset-4">
            {me.entered_today ? "See the pot" : "Enter now"}
          </Link>
        </p>
      </div>

      {me.winnings.length > 0 && (
        <div className="card p-6">
          <p className="eyebrow">Your prizes</p>
          <ul className="mt-3 divide-y divide-line">
            {me.winnings.map((w) => (
              <li key={w.draw_id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <span>{weekLabel(w.week_start)}</span>
                <span className="text-muted">{STATUS_TEXT[w.status]}</span>
                <span className="num font-semibold">{formatMoney(w.amount, w.currency, true)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        className="btn-ghost"
        onClick={async () => {
          signingOut.current = true;
          await signOut();
          router.replace("/");
        }}
      >
        Sign out
      </button>
    </div>
  );
}

function guessCountry(): string {
  try {
    const region = new Intl.Locale(navigator.language).maximize().region ?? "";
    return isCountryCode(region) ? region : "";
  } catch {
    return "";
  }
}

function ProfileForm({
  defaultName,
  defaultCountry,
  countryLocked,
  onSaved,
}: {
  defaultName: string;
  defaultCountry: string;
  countryLocked: boolean;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(defaultName);
  // Lazy init runs only in the browser here: this form renders after sign-in.
  const [country, setCountry] = useState(() => defaultCountry || guessCountry());
  const [adult, setAdult] = useState(false);
  const [rules, setRules] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const excluded = EXCLUDED_COUNTRIES.includes(country);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await saveProfile(name, country, adult, rules);
      await onSaved();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="name" className="label">Name to show if you win</label>
        <input id="name" className="field" required maxLength={40} placeholder="e.g. Maya R." value={name} onChange={(e) => setName(e.target.value)} />
        <p className="mt-1.5 text-xs text-muted">First name and last initial is plenty. This appears in public results.</p>
      </div>
      <div>
        <label htmlFor="country" className="label">Country of residence</label>
        <select id="country" className="field" required disabled={countryLocked} value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="" disabled>Choose a country</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
        {excluded && <p className="mt-1.5 text-sm text-bad">Sorry, residents of this country can&apos;t enter.</p>}
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[rgb(var(--ink))]" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
        I am {MIN_AGE} or older, and at least the age of majority where I live.
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[rgb(var(--ink))]" checked={rules} onChange={(e) => setRules(e.target.checked)} />
        <span>
          I accept the <Link href="/rules/" target="_blank" className="underline underline-offset-2">official rules</Link>, including one account per person.
        </span>
      </label>
      <button type="submit" className="btn-dark w-full" disabled={busy || excluded || !adult || !rules || !country}>
        {busy ? "Saving…" : "Save and go to the draw"}
      </button>
      {error && <p className="text-sm text-bad">{error}</p>}
    </form>
  );
}

function ClaimForm({ drawId, onDone }: { drawId: string; onDone: () => Promise<void> }) {
  const [legalName, setLegalName] = useState("");
  const [payout, setPayout] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await claimPrize(drawId, legalName, payout);
      await onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const input =
    "h-11 w-full rounded-xl border border-accent-ink/20 bg-white/70 px-3 text-sm text-accent-ink placeholder:text-accent-ink/40 focus:outline-none focus:ring-2 focus:ring-accent-ink/40";
  return (
    <form onSubmit={submit} className="space-y-3">
      <input className={input} required placeholder="Full legal name (must match your ID)" value={legalName} onChange={(e) => setLegalName(e.target.value)} />
      <input className={input} required placeholder="Where to pay you, e.g. PayPal email or Wise details" value={payout} onChange={(e) => setPayout(e.target.value)} />
      <button className="btn-ticket w-full" disabled={busy}>{busy ? "Submitting…" : "Claim my prize"}</button>
      <p className="text-xs opacity-70">We&apos;ll verify your identity before paying. One prize per person.</p>
      {error && <p className="text-sm font-medium text-bad">{error}</p>}
    </form>
  );
}
