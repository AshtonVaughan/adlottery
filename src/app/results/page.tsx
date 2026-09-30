"use client";

import Link from "next/link";
import { getPastDraws } from "@/lib/queries";
import { useLoad, LoadError } from "@/components/use-load";
import { countryName } from "@/lib/countries";
import { weekLabel } from "@/lib/week";
import { formatMoney } from "@/lib/utils";

export default function ResultsPage() {
  const { data: draws, error, loading } = useLoad(getPastDraws);
  if (error) return <LoadError message={error} />;
  return (
    <div className="container max-w-3xl py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Results</h1>
      <p className="mt-2 text-muted">Every past draw, its winner, and the proof you can check yourself.</p>

      {loading ? (
        <div className="card mt-8 h-40 animate-pulse" />
      ) : !draws?.length ? (
        <p className="card mt-8 p-6 text-muted">No draws yet. The first winner is drawn next Monday.</p>
      ) : (
        <ul className="card mt-8 divide-y divide-line">
          {draws.map(({ draw, winner }) => (
            <li key={draw.id}>
              <Link
                href={`/draw/?id=${draw.id}`}
                className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 p-5 hover:bg-bg/60 sm:grid-cols-[10rem_1fr_auto]"
              >
                <span className="text-sm text-muted">{weekLabel(draw.week_start)}</span>
                <span className="order-3 col-span-2 font-medium sm:order-none sm:col-span-1">
                  {winner ? (
                    <>
                      {winner.name}
                      {winner.country && <span className="text-muted"> · {countryName(winner.country)}</span>}
                    </>
                  ) : (
                    <span className="text-muted">No entries, rolled over</span>
                  )}
                </span>
                <span className="num text-right font-semibold">{formatMoney(draw.prize_amount ?? 0, draw.currency)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
