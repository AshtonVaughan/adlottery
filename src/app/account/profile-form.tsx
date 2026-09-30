"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { COUNTRIES } from "@/lib/countries";
import { EXCLUDED_COUNTRIES, MIN_AGE } from "@/lib/config";

export function ProfileForm({
  defaultName,
  defaultCountry,
  countryLocked,
}: {
  defaultName: string;
  defaultCountry: string;
  countryLocked: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [country, setCountry] = useState(defaultCountry);
  const [adult, setAdult] = useState(false);
  const [rules, setRules] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const excluded = EXCLUDED_COUNTRIES.includes(country);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ display_name: name, country_code: country, confirm_adult: adult, accept_rules: rules }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(body.error ?? "Could not save.");
    router.push("/");
    router.refresh();
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
        <select
          id="country"
          className="field"
          required
          disabled={countryLocked}
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        >
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
          I accept the <Link href="/rules" target="_blank" className="underline underline-offset-2">official rules</Link>, including one account per person.
        </span>
      </label>
      <button type="submit" className="btn-dark w-full" disabled={busy || excluded || !adult || !rules}>
        {busy ? "Saving…" : "Save and go to the draw"}
      </button>
      {error && <p className="text-sm text-bad">{error}</p>}
    </form>
  );
}
