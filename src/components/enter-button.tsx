"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";

export type EnterState =
  | { kind: "demo" }
  | { kind: "signed_out" }
  | { kind: "needs_profile" }
  | { kind: "blocked"; message: string }
  | { kind: "ready"; entries: number }
  | { kind: "entered"; entries: number };

function untilUtcMidnight(): string {
  const now = new Date();
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  const mins = Math.ceil((next - now.getTime()) / 60000);
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function entriesLine(n: number): string {
  return `${n} ${n === 1 ? "entry" : "entries"} this week`;
}

export function EnterButton({ initial }: { initial: EnterState }) {
  const [state, setState] = useState<EnterState>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enter() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/enter", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Something went wrong. Try again.");
        return;
      }
      setState({ kind: "entered", entries: body.entriesThisDraw });
    } finally {
      setBusy(false);
    }
  }

  switch (state.kind) {
    case "demo":
      return (
        <div className="space-y-2">
          <button className="btn-ticket btn-lg w-full" disabled>
            Enter free today
          </button>
          <p className="text-center text-sm opacity-70">Demo mode: connect Supabase to take entries.</p>
        </div>
      );
    case "signed_out":
      return (
        <div className="space-y-2">
          <Link href="/login" className="btn-ticket btn-lg w-full">
            Enter free today
          </Link>
          <p className="text-center text-sm opacity-70">Sign in with your email. No password, no payment.</p>
        </div>
      );
    case "needs_profile":
      return (
        <div className="space-y-2">
          <Link href="/account" className="btn-ticket btn-lg w-full">
            Finish sign-up to enter
          </Link>
          <p className="text-center text-sm opacity-70">We need your name and country. Takes 20 seconds.</p>
        </div>
      );
    case "blocked":
      return <p className="rounded-xl bg-accent-ink/[0.07] p-4 text-center text-sm">{state.message}</p>;
    case "ready":
      return (
        <div className="space-y-2">
          <button className="btn-ticket btn-lg w-full" onClick={enter} disabled={busy}>
            {busy ? "Entering…" : "Enter free today"}
          </button>
          <p className="text-center text-sm opacity-70">
            {state.entries > 0 ? entriesLine(state.entries) : "One free entry every day, up to 7 a week."}
          </p>
          {error && <p className="text-center text-sm font-medium text-bad">{error}</p>}
        </div>
      );
    case "entered":
      return (
        <div className="space-y-2">
          <div className="flex h-14 items-center justify-center gap-2 rounded-full bg-accent-ink text-base font-semibold text-accent">
            <Check className="h-5 w-5" strokeWidth={3} /> You&apos;re in today
          </div>
          <p className="text-center text-sm opacity-70">
            {entriesLine(state.entries)} · next entry in {untilUtcMidnight()}
          </p>
        </div>
      );
  }
}
