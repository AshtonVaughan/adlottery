"use client";

import Link from "next/link";
import { ArrowRight, CalendarCheck, Coins, ShieldCheck } from "lucide-react";
import { getHome } from "@/lib/queries";
import { useLoad, LoadError } from "@/components/use-load";
import { useAuth } from "@/components/auth-provider";
import { EnterButton } from "@/components/enter-button";
import { Countdown } from "@/components/countdown";
import { PotBreakdown } from "@/components/pot-breakdown";
import { AdSlot } from "@/components/ad-slot";
import { AD_SHARE_PERCENT, CLAIM_WINDOW_DAYS, SPONSOR_CONTACT } from "@/lib/config";
import { countryName } from "@/lib/countries";
import { weekLabel } from "@/lib/week";
import { formatMoney, formatUtc } from "@/lib/utils";
import type { DrawView } from "@/lib/types";

export default function HomePage() {
  const { me } = useAuth();
  // Reload the pot/entry count after the signed-in user's entry count changes.
  const { data, error } = useLoad(getHome, me?.entries);
  if (error) return <LoadError message={error} />;
  const current = data?.current ?? null;
  const last = data?.last ?? null;

  return (
    <>
      <section className="container grid gap-10 pb-16 pt-10 md:pt-16 lg:grid-cols-[1.35fr_1fr] lg:items-center lg:gap-14">
        <div className="min-w-0">
          <p className="eyebrow">{current ? weekLabel(current.draw.week_start) + " · " : ""}This week&apos;s pot</p>
          <h1 className="num mt-3 break-words text-[clamp(4.25rem,17vw,9.5rem)] font-semibold leading-[0.85] tracking-tightest">
            {current ? formatMoney(current.pot.total, current.draw.currency) : <span className="text-line">$—</span>}
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted">One free draw. One winner takes the whole pot every Monday.</p>
          {current && (
            <>
              <div className="mt-8 max-w-xl">
                <PotBreakdown pot={current.pot} currency={current.draw.currency} />
              </div>
              {current.sponsor && <SponsorLine view={current} />}
            </>
          )}
        </div>

        <div className="ticket rounded-2xl bg-accent p-6 text-accent-ink sm:p-8">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold uppercase tracking-[0.14em]">Draw closes in</p>
            {current && <p className="num text-sm opacity-70">{current.entries.toLocaleString("en-US")} entries</p>}
          </div>
          <div className="mt-4">
            {current ? <Countdown to={current.draw.closes_at} /> : <div className="h-[68px] rounded-xl bg-accent-ink/[0.07]" />}
          </div>
          <div className="my-6 border-t-2 border-dashed border-accent-ink/25" />
          <EnterButton />
          {current && (
            <p className="mt-4 text-center text-xs opacity-60">
              Closes {formatUtc(current.draw.closes_at)} · winner drawn right after
            </p>
          )}
        </div>
      </section>

      <section className="border-y border-line/70 bg-surface/60">
        <div className="container grid gap-8 py-14 md:grid-cols-3">
          <Step icon={CalendarCheck} title="Enter free, every day">
            Sign in with your email and tap enter. One entry a day, up to seven a week. You never pay, and you never
            have to watch or click an ad.
          </Step>
          <Step icon={Coins} title="Sponsors and ads fill the pot">
            Each week&apos;s sponsor puts in the base prize, and {AD_SHARE_PERCENT}% of this site&apos;s ad revenue is
            added on top. Every dollar is listed in a public ledger.
          </Step>
          <Step icon={ShieldCheck} title="One winner, provably fair">
            Before entries close we publish a locked-in secret and pick a future public random number. Anyone can
            re-run the draw and check the winner.
          </Step>
        </div>
      </section>

      <section className="container grid gap-10 py-16 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
        <div className="space-y-10">
          {last && <LastResult view={last} />}
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Where the money comes from</h2>
            <div className="mt-4 space-y-3 text-muted">
              <p>
                <span className="font-medium text-ink">Sponsors</span>{" "}pay to put their name on a week, and their
                money goes straight into that week&apos;s pot.
              </p>
              <p>
                <span className="font-medium text-ink">Ads</span>{" "}on this site earn revenue, and {AD_SHARE_PERCENT}% of
                it goes into the pot. The rest keeps the lights on.
              </p>
              <p>
                <span className="font-medium text-ink">Unclaimed prizes</span>{" "}roll over. A winner has{" "}
                {CLAIM_WINDOW_DAYS} days to claim; after that, the money goes into the next pot.
              </p>
            </div>
            {current && (
              <Link
                href={`/draw/?id=${current.draw.id}`}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
              >
                See this week&apos;s ledger <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
        <AdSlot className="lg:pt-1" />
      </section>

      <section className="container">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-ink p-8 text-bg sm:p-10 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Put your brand on the pot</h2>
            <p className="mt-2 max-w-lg opacity-70">
              Sponsor a week: your name on every page, and your prize in front of everyone who enters.
            </p>
          </div>
          <a href={`mailto:${SPONSOR_CONTACT}?subject=Sponsoring%20a%20week`} className="btn-primary shrink-0">
            Sponsor a week
          </a>
        </div>
      </section>
    </>
  );
}

function SponsorLine({ view }: { view: DrawView }) {
  const s = view.sponsor!;
  return (
    <p className="mt-6 text-sm text-muted">
      This week presented by{" "}
      {s.url ? (
        <a href={s.url} target="_blank" rel="noopener sponsored" className="font-semibold text-ink underline-offset-4 hover:underline">
          {s.name}
        </a>
      ) : (
        <span className="font-semibold text-ink">{s.name}</span>
      )}
      {s.tagline && <> · {s.tagline}</>}
    </p>
  );
}

function Step({ icon: Icon, title, children }: { icon: typeof Coins; title: string; children: React.ReactNode }) {
  return (
    <div>
      <Icon className="h-6 w-6" strokeWidth={1.75} />
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">{children}</p>
    </div>
  );
}

function LastResult({ view }: { view: DrawView }) {
  const { draw, winner } = view;
  return (
    <div className="card p-6">
      <p className="eyebrow">Last draw · {weekLabel(draw.week_start)}</p>
      {winner ? (
        <p className="mt-3 text-2xl font-semibold tracking-tight">
          {winner.name}
          {winner.country && <span className="text-muted"> from {countryName(winner.country)}</span>} won{" "}
          <span className="num">{formatMoney(draw.prize_amount ?? 0, draw.currency, true)}</span>
        </p>
      ) : (
        <p className="mt-3 text-2xl font-semibold tracking-tight">No entries, so the pot rolled over.</p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
        <span className="num">{(draw.total_entries ?? 0).toLocaleString("en-US")} entries</span>
        <Link href={`/draw/?id=${draw.id}`} className="inline-flex items-center gap-1 font-medium text-ink underline-offset-4 hover:underline">
          Verify this draw <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
