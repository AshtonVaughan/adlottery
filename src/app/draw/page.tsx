"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, ExternalLink } from "lucide-react";
import { getContributions, getDraw, getEntryIds, getMyEntryIds } from "@/lib/queries";
import { useLoad, LoadError } from "@/components/use-load";
import { useAuth } from "@/components/auth-provider";
import { drandRoundTime, drandRoundUrl } from "@/lib/drand";
import { countryName } from "@/lib/countries";
import { weekLabel } from "@/lib/week";
import { formatMoney, formatUtc } from "@/lib/utils";
import type { Draw } from "@/lib/types";

const SOURCE_LABEL = { sponsor: "Sponsor", ads: "Ad revenue", rollover: "Rollover" } as const;
const STATUS_LABEL: Record<Draw["status"], string> = {
  open: "Open for entries",
  closed: "Closed, drawing soon",
  drawn: "Drawn",
};

export default function DrawPage() {
  return (
    <Suspense fallback={<div className="container max-w-4xl py-14"><div className="card h-64 animate-pulse" /></div>}>
      <DrawDetail />
    </Suspense>
  );
}

function DrawDetail() {
  const id = useSearchParams().get("id") ?? "";
  const { session } = useAuth();
  const { data, error, loading } = useLoad(async () => {
    const view = await getDraw(id);
    if (!view) return null;
    const [contributions, mine] = await Promise.all([
      getContributions(view),
      session ? getMyEntryIds(view.draw.id) : Promise.resolve([]),
    ]);
    return { view, contributions, mine };
  }, `${id}:${session?.user.id ?? ""}`);

  if (error) return <LoadError message={error} />;
  if (loading) return <div className="container max-w-4xl py-14"><div className="card h-64 animate-pulse" /></div>;
  if (!data) return <LoadError message="No draw with that id." />;

  const { view, contributions, mine } = data;
  const { draw, pot, winner, entries } = view;
  const drawn = draw.status === "drawn";

  return (
    <div className="container max-w-4xl py-14">
      <p className="eyebrow">
        {weekLabel(draw.week_start)} · {STATUS_LABEL[draw.status]}
      </p>
      <h1 className="num mt-3 text-6xl font-semibold tracking-tightest sm:text-7xl">
        {formatMoney(drawn ? draw.prize_amount ?? 0 : pot.total, draw.currency, true)}
      </h1>
      <p className="mt-3 text-muted">
        {drawn ? (
          winner ? (
            <>
              Won by <span className="font-medium text-ink">{winner.name}</span>
              {winner.country && ` from ${countryName(winner.country)}`}.
            </>
          ) : (
            "No entries this week, so the pot rolled over."
          )
        ) : (
          `${entries.toLocaleString("en-US")} entries so far. Closes ${formatUtc(draw.closes_at)}.`
        )}
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="font-semibold">Pot ledger</h2>
          <p className="mt-1 text-sm text-muted">Every dollar in this week&apos;s pot.</p>
          {contributions.length === 0 ? (
            <p className="mt-6 text-sm text-muted">Nothing added yet.</p>
          ) : (
            <table className="mt-4 w-full text-sm">
              <tbody className="divide-y divide-line">
                {contributions.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2.5 pr-3">
                      <div className="font-medium">{SOURCE_LABEL[c.source]}</div>
                      {c.note && <div className="text-xs text-muted">{c.note}</div>}
                    </td>
                    <td className="num py-2.5 text-right">{formatMoney(c.amount, draw.currency, true)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="pt-3 font-semibold">Total</td>
                  <td className="num pt-3 text-right font-semibold">{formatMoney(pot.total, draw.currency, true)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </section>

        <section className="card p-6">
          <h2 className="font-semibold">Fairness proof</h2>
          <p className="mt-1 text-sm text-muted">Both of these were published when the draw opened, before anyone entered.</p>
          <dl className="mt-4 space-y-4 text-sm">
            <Item label="Secret seed hash">
              <code className="break-all font-mono text-xs">{draw.seed_hash}</code>
            </Item>
            <Item label="Public random number">
              <a href={drandRoundUrl(draw.randomness_round)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2">
                drand round {Number(draw.randomness_round).toLocaleString("en-US")} <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <span className="text-muted"> · released {formatUtc(drandRoundTime(draw.randomness_round))}</span>
            </Item>
            {drawn && (
              <>
                <Item label="Revealed seed">
                  <code className="break-all font-mono text-xs">{draw.seed}</code>
                </Item>
                <Item label="Random number (drand output)">
                  <code className="break-all font-mono text-xs">{draw.randomness}</code>
                </Item>
                <Item label="Result">
                  {draw.total_entries ? (
                    <>
                      Entry <span className="num font-medium">#{draw.winner_index}</span> of{" "}
                      <span className="num">{draw.total_entries.toLocaleString("en-US")}</span> (counting from 0)
                      <EntryListButton drawId={draw.id} weekStart={draw.week_start} />
                    </>
                  ) : (
                    "No entries."
                  )}
                </Item>
              </>
            )}
          </dl>
        </section>
      </div>

      {mine.length > 0 && (
        <section className="card mt-6 p-6">
          <h2 className="font-semibold">Your entries in this draw</h2>
          <p className="mt-1 text-sm text-muted">After the draw, check each one appears in the entry list.</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {mine.map((e) => (
              <li key={e} className="rounded-lg bg-bg px-2 py-1 font-mono text-xs">{e}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 rounded-2xl bg-ink p-6 text-bg sm:p-8">
        <h2 className="font-semibold">Check it yourself</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm opacity-80">
          <li>sha256(seed) must equal the seed hash published at the start.</li>
          <li>The random number must match drand&apos;s published value for that round.</li>
          <li>Entries are ordered by entry time, then id. The winner is the entry at this index:</li>
        </ol>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-bg/10 p-4 font-mono text-xs leading-relaxed">
{`const { createHash } = require("node:crypto");
const seed = "${draw.seed ?? "<revealed after the draw>"}";
const random = "${draw.randomness ?? "<drand output>"}";
const total = ${draw.total_entries ?? "<number of entries>"};

createHash("sha256").update(seed).digest("hex") === "${draw.seed_hash.slice(0, 16)}…";
const h = createHash("sha256").update(seed + "|" + random).digest("hex");
const index = Number(BigInt("0x" + h.slice(0, 13)) % BigInt(total));`}
        </pre>
      </section>
    </div>
  );
}

function EntryListButton({ drawId, weekStart }: { drawId: string; weekStart: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function download() {
    setBusy(true);
    setError(null);
    try {
      const ids = await getEntryIds(drawId);
      if (!ids) throw new Error("Entry list not available.");
      const url = URL.createObjectURL(new Blob([ids.join("\n") + "\n"], { type: "text/plain" }));
      const a = Object.assign(document.createElement("a"), { href: url, download: `entries-${weekStart}.txt` });
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {" · "}
      <button onClick={download} disabled={busy} className="inline-flex items-center gap-1 underline underline-offset-2">
        <Download className="h-3.5 w-3.5" /> {busy ? "Preparing…" : "entry list"}
      </button>
      {error && <span className="block text-xs text-bad">{error}</span>}
    </>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}
