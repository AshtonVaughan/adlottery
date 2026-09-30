"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ClaimForm({ drawId }: { drawId: string }) {
  const router = useRouter();
  const [legalName, setLegalName] = useState("");
  const [payout, setPayout] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/claim", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ draw_id: drawId, legal_name: legalName, payout_details: payout }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(body.error ?? "Could not submit.");
    router.refresh();
  }

  const input = "h-11 w-full rounded-xl border border-accent-ink/20 bg-white/70 px-3 text-sm text-accent-ink placeholder:text-accent-ink/40 focus:outline-none focus:ring-2 focus:ring-accent-ink/40";
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
