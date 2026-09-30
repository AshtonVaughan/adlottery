"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useLoad, LoadError } from "@/components/use-load";
import { PotBreakdown } from "@/components/pot-breakdown";
import {
  adminAddContribution,
  adminOverview,
  adminSetBan,
  adminSetSponsor,
  adminUpdateWinner,
} from "@/lib/queries";
import { AD_SHARE_PERCENT, LOCAL_DEV } from "@/lib/config";
import { localDrawNow } from "@/lib/local-dev";
import { countryName } from "@/lib/countries";
import { weekLabel } from "@/lib/week";
import { formatMoney, formatUtc } from "@/lib/utils";
import type { AdminWinner } from "@/lib/types";

export default function AdminPage() {
  const router = useRouter();
  const { ready, me } = useAuth();
  useEffect(() => {
    if (ready && !me?.is_admin) router.replace("/");
  }, [ready, me, router]);
  if (!ready || !me?.is_admin) return <div className="container max-w-4xl py-14"><div className="card h-48 animate-pulse" /></div>;
  return <Admin />;
}

function Admin() {
  const { data, error, reload } = useLoad(adminOverview);
  if (error) return <LoadError message={error} />;
  if (!data) return <div className="container max-w-4xl py-14"><div className="card h-48 animate-pulse" /></div>;
  const { draw, pot, entries, sponsor } = data.current;

  return (
    <div className="container max-w-4xl space-y-6 py-14">
      <div>
        <p className="eyebrow">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{weekLabel(draw.week_start)}</h1>
        <p className="mt-1 text-sm text-muted">
          {entries.toLocaleString("en-US")} entries · closes {formatUtc(draw.closes_at)}
          {sponsor && <> · sponsor: {sponsor.name}</>}
        </p>
      </div>

      {LOCAL_DEV && <DrawNow onDone={reload} />}

      <section className="card p-6">
        <p className="eyebrow">Pot</p>
        <p className="num mt-2 text-4xl font-semibold tracking-tight">{formatMoney(pot.total, draw.currency, true)}</p>
        <div className="mt-4">
          <PotBreakdown pot={pot} currency={draw.currency} />
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-6">
          <h2 className="font-semibold">Add money to this pot</h2>
          <p className="mt-1 text-sm text-muted">For ad revenue, enter the gross amount; {AD_SHARE_PERCENT}% goes in.</p>
          <div className="mt-4"><ContributionForm onDone={reload} /></div>
        </section>
        <section className="card p-6">
          <h2 className="font-semibold">This week&apos;s sponsor</h2>
          <p className="mt-1 text-sm text-muted">Shown on the home page. Add their money separately.</p>
          <div className="mt-4"><SponsorForm onDone={reload} /></div>
        </section>
      </div>

      <section className="card p-6">
        <h2 className="font-semibold">Winners</h2>
        {data.winners.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No winners yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {data.winners.map((w) => (
              <WinnerRow key={w.draw_id} w={w} onDone={reload} />
            ))}
          </ul>
        )}
      </section>

      <section className="card p-6">
        <h2 className="font-semibold">Ban or unban an account</h2>
        <div className="mt-4"><BanForm /></div>
      </section>
    </div>
  );
}

function useAction() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  async function run(fn: () => Promise<unknown>, success: string): Promise<boolean> {
    setBusy(true);
    setMessage(null);
    try {
      await fn();
      setMessage({ ok: true, text: success });
      return true;
    } catch (err) {
      setMessage({ ok: false, text: (err as Error).message });
      return false;
    } finally {
      setBusy(false);
    }
  }
  const note = message && <p className={`text-sm ${message.ok ? "text-good" : "text-bad"}`}>{message.text}</p>;
  return { busy, run, note };
}

function ContributionForm({ onDone }: { onDone: () => Promise<void> }) {
  const { busy, run, note } = useAction();
  const [source, setSource] = useState<"sponsor" | "ads">("sponsor");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (await run(() => adminAddContribution(source, Number(amount), memo), "Added to the pot.")) {
          setAmount("");
          setMemo("");
          await onDone();
        }
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <select className="field" value={source} onChange={(e) => setSource(e.target.value as "sponsor" | "ads")}>
          <option value="sponsor">Sponsor money</option>
          <option value="ads">Gross ad revenue</option>
        </select>
        <input className="field num" required inputMode="decimal" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <input className="field" placeholder="Note (optional, public)" value={memo} onChange={(e) => setMemo(e.target.value)} />
      <button className="btn-dark w-full" disabled={busy}>Add to pot</button>
      {note}
    </form>
  );
}

function SponsorForm({ onDone }: { onDone: () => Promise<void> }) {
  const { busy, run, note } = useAction();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [tagline, setTagline] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (await run(() => adminSetSponsor(name, url, tagline), "Sponsor set.")) await onDone();
      }}
    >
      <input className="field" required placeholder="Sponsor name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="field" type="url" placeholder="https://sponsor.com" value={url} onChange={(e) => setUrl(e.target.value)} />
      <input className="field" placeholder="Tagline (optional)" value={tagline} onChange={(e) => setTagline(e.target.value)} />
      <button className="btn-dark w-full" disabled={busy}>Set sponsor</button>
      {note}
    </form>
  );
}

function WinnerRow({ w, onDone }: { w: AdminWinner; onDone: () => Promise<void> }) {
  const { busy, run, note } = useAction();
  const [reference, setReference] = useState("");
  const act = async (status: "verified" | "paid" | "forfeited", msg: string) => {
    if (await run(() => adminUpdateWinner(w.draw_id, status, reference), msg)) await onDone();
  };
  const open = w.status !== "paid" && w.status !== "forfeited";

  return (
    <li className="grid gap-3 py-4 text-sm md:grid-cols-[1fr_auto]">
      <div className="space-y-1">
        <p className="font-medium">
          {weekLabel(w.week_start)} · <span className="num">{formatMoney(w.amount, w.currency, true)}</span> ·{" "}
          <span className="uppercase tracking-wide text-muted">{w.status}</span>
        </p>
        <p className="text-muted">
          {w.email ? `${w.display_name} · ${w.email} · ${countryName(w.country_code ?? "")}` : "Deleted account"}
        </p>
        {w.legal_name && <p>Legal name: {w.legal_name}</p>}
        {w.payout_details && <p>Pay to: {w.payout_details}</p>}
        {w.payout_reference && <p>Reference: {w.payout_reference}</p>}
        {w.status === "pending" && <p className="text-muted">Claim deadline {formatUtc(w.claim_deadline)}</p>}
      </div>
      {open && (
        <div className="flex flex-col items-stretch gap-2 md:w-56">
          {w.status === "claimed" && (
            <button className="btn-dark h-9" disabled={busy} onClick={() => act("verified", "Verified.")}>
              Mark ID verified
            </button>
          )}
          {w.status === "verified" && (
            <>
              <input className="field h-9" placeholder="Payout reference" value={reference} onChange={(e) => setReference(e.target.value)} />
              <button className="btn-dark h-9" disabled={busy || !reference} onClick={() => act("paid", "Marked paid.")}>
                Mark paid
              </button>
            </>
          )}
          <button
            className="btn-ghost h-9"
            disabled={busy}
            onClick={() => {
              if (confirm("Forfeit this prize? The money rolls into the current pot.")) act("forfeited", "Forfeited and rolled over.");
            }}
          >
            Forfeit
          </button>
          {note}
        </div>
      )}
    </li>
  );
}

function BanForm() {
  const { busy, run, note } = useAction();
  const [email, setEmail] = useState("");
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input className="field" type="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn-dark shrink-0" disabled={busy || !email} onClick={() => run(() => adminSetBan(email, true), "Banned.")}>
          Ban
        </button>
        <button className="btn-ghost shrink-0" disabled={busy || !email} onClick={() => run(() => adminSetBan(email, false), "Unbanned.")}>
          Unban
        </button>
      </div>
      {note}
    </div>
  );
}

function DrawNow({ onDone }: { onDone: () => Promise<void> }) {
  const { busy, run, note } = useAction();
  return (
    <section className="card flex flex-col gap-3 border-dashed p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-semibold">Local mode: skip to Monday</h2>
        <p className="mt-1 text-sm text-muted">
          Closes this week&apos;s draw now and picks the winner with a live drand round. A new week opens straight away.
        </p>
      </div>
      <div className="space-y-2 sm:text-right">
        <button
          className="btn-primary"
          disabled={busy}
          onClick={async () => {
            let msg = "";
            if (await run(async () => (msg = await localDrawNow()), "Drawn.")) {
              await onDone();
              alert(msg);
            }
          }}
        >
          {busy ? "Drawing…" : "Draw now"}
        </button>
        {note}
      </div>
    </section>
  );
}
