"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { enterDraw, ENTRY_BLOCK_MESSAGES } from "@/lib/queries";

function untilUtcMidnight(): string {
  const now = new Date();
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  const mins = Math.ceil((next - now.getTime()) / 60000);
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function entriesLine(n: number): string {
  return `${n} ${n === 1 ? "entry" : "entries"} this week`;
}

export function EnterButton() {
  const { demo, ready, session, me, refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enter() {
    setBusy(true);
    setError(null);
    try {
      await enterDraw();
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (demo) {
    return (
      <Wrap note="Demo mode: connect Supabase to take entries.">
        <button className="btn-ticket btn-lg w-full" disabled>Enter free today</button>
      </Wrap>
    );
  }
  if (!ready) {
    return (
      <Wrap note=" ">
        <button className="btn-ticket btn-lg w-full" disabled>Enter free today</button>
      </Wrap>
    );
  }
  if (!session) {
    return (
      <Wrap note="Sign in with your email. No password, no payment.">
        <Link href="/login/" className="btn-ticket btn-lg w-full">Enter free today</Link>
      </Wrap>
    );
  }
  if (!me || me.block === "needs_profile") {
    return (
      <Wrap note="We need your name and country. Takes 20 seconds.">
        <Link href="/account/" className="btn-ticket btn-lg w-full">Finish sign-up to enter</Link>
      </Wrap>
    );
  }
  if (me.block) {
    return <p className="rounded-xl bg-accent-ink/[0.07] p-4 text-center text-sm">{ENTRY_BLOCK_MESSAGES[me.block]}</p>;
  }
  if (me.entered_today) {
    return (
      <Wrap note={`${entriesLine(me.entries)} · next entry in ${untilUtcMidnight()}`}>
        <div className="flex h-14 items-center justify-center gap-2 rounded-full bg-accent-ink text-base font-semibold text-accent">
          <Check className="h-5 w-5" strokeWidth={3} /> You&apos;re in today
        </div>
      </Wrap>
    );
  }
  return (
    <Wrap note={me.entries > 0 ? entriesLine(me.entries) : "One free entry every day, up to 7 a week."}>
      <button className="btn-ticket btn-lg w-full" onClick={enter} disabled={busy}>
        {busy ? "Entering…" : "Enter free today"}
      </button>
      {error && <p className="text-center text-sm font-medium text-bad">{error}</p>}
    </Wrap>
  );
}

function Wrap({ note, children }: { note: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      {children}
      <p className="min-h-5 text-center text-sm opacity-70">{note}</p>
    </div>
  );
}
