"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { getHome, getPastDraws } from "@/lib/queries";
import { useLoad, LoadError } from "@/components/use-load";
import { useAuth } from "@/components/auth-provider";
import { EnterButton } from "@/components/enter-button";
import { Countdown, TimeLeft } from "@/components/countdown";
import { CountUp } from "@/components/count-up";
import { Reveal } from "@/components/reveal";
import { AdSlot } from "@/components/ad-slot";
import { AD_SHARE_PERCENT, CLAIM_WINDOW_DAYS, EXCLUDED_COUNTRIES, MIN_AGE, SPONSOR_CONTACT } from "@/lib/config";
import { countryName } from "@/lib/countries";
import { drandRoundTime } from "@/lib/drand";
import { isoWeek, weekLabel } from "@/lib/week";
import { formatMoney, formatUtc } from "@/lib/utils";
import type { DrawView } from "@/lib/types";

async function loadLanding() {
  const [home, past] = await Promise.all([getHome(), getPastDraws()]);
  return { ...home, past };
}

export default function HomePage() {
  const { me } = useAuth();
  const { data, error } = useLoad(loadLanding, me?.entries);
  if (error) return <LoadError message={error} />;
  const current = data?.current ?? null;
  const last = data?.last ?? null;

  return (
    <>
      <Hero current={current} last={last} />
      <Ticker past={data?.past ?? []} />
      <HowItWorks current={current} />
      <Money current={current} />
      <div className="container py-4">
        <AdSlot />
      </div>
      <Fairness current={current} last={last} />
      {last?.winner && <LastWinner view={last} />}
      <Sponsor />
      <Faq />
      <FinalCall current={current} />
    </>
  );
}

/* ------------------------------------------------------------------ */

function Hero({ current, last }: { current: DrawView | null; last: DrawView | null }) {
  const week = current ? isoWeek(new Date(`${current.draw.week_start}T00:00:00Z`)) : null;
  return (
    <section className="container grid items-center gap-x-20 gap-y-12 pb-20 pt-12 md:pt-20 lg:grid-cols-[1.15fr_1fr]">
      <div className="lg:row-start-1">
        <h1 className="display text-[clamp(3.1rem,7.2vw,6.4rem)]">
          <span className="block whitespace-nowrap">One free draw.</span>
          <span className="block whitespace-nowrap">One winner.</span>
          <em className="block whitespace-nowrap text-ink/55">Every Monday.</em>
        </h1>
        <p className="mt-8 max-w-[34rem] text-lg leading-relaxed text-ink/70">
          Enter once a day, free. Sponsors and ads fill the pot through the week, and on Monday one person takes all
          of it. You can check the draw yourself.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <a href="#enter" className="btn-dark btn-lg">
            Enter this week&apos;s draw
          </a>
          <a href="#how" className="btn btn-lg px-5 text-ink/70 hover:text-ink">
            How it works <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div id="enter" className="mx-auto w-full max-w-[26rem] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:justify-self-end">
        <div className="-rotate-[1.5deg] transition-transform duration-500 ease-out hover:rotate-0">
          <div className="ticket rounded-[22px] bg-accent text-accent-ink shadow-[0_30px_60px_-30px_rgb(60_45_0/0.45)]">
            <div className="px-7 pb-6 pt-6">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-medium">Admit one · free entry</span>
                <span className="num font-mono opacity-60">
                  No. {week ? `${week.year}-${String(week.week).padStart(2, "0")}` : "····-··"}
                </span>
              </div>
              <p className="mt-8 text-sm opacity-70">This week&apos;s pot</p>
              <p className="mt-1 font-serif text-[clamp(3.8rem,13vw,5.4rem)] leading-none">
                {current ? <CountUp value={current.pot.total} currency={current.draw.currency} /> : <span className="opacity-30">$0</span>}
              </p>
              {current?.sponsor && (
                <p className="mt-3 text-sm opacity-70">
                  Presented by <span className="font-medium opacity-100">{current.sponsor.name}</span>
                </p>
              )}
            </div>
            <div className="mx-6 border-t-2 border-dashed border-accent-ink/20" />
            <div className="px-7 pb-7 pt-6">
              <p className="mb-3 text-sm opacity-70">Entries close in</p>
              {current ? <Countdown to={current.draw.closes_at} /> : <div className="h-[58px]" />}
              <div className="mt-7">
                <EnterButton />
              </div>
            </div>
          </div>
        </div>
      </div>
      <dl className="grid max-w-lg grid-cols-3 border-t border-line pt-6 lg:col-start-1 lg:row-start-2 lg:-mt-4">
        <Stat label="entries this week" value={current ? current.entries.toLocaleString("en-US") : "—"} />
        <Stat
          label="last week's pot"
          value={last ? formatMoney(last.draw.prize_amount ?? 0, last.draw.currency) : "—"}
        />
        <Stat label="to enter" value="$0" />
      </dl>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dd className="num font-serif text-3xl leading-none">{value}</dd>
      <dt className="mt-2 text-sm text-muted">{label}</dt>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Ticker({ past }: { past: DrawView[] }) {
  const winners = past
    .filter((v) => v.winner)
    .slice(0, 8)
    .map((v) => `${v.winner!.name}${v.winner!.country ? `, ${countryName(v.winner!.country)}` : ""} won ${formatMoney(v.draw.prize_amount ?? 0, v.draw.currency, true)}`);
  const items = [
    ...winners,
    "No purchase necessary",
    `${AD_SHARE_PERCENT}% of ad revenue goes into the pot`,
    "One entry a day, up to seven a week",
    "Drawn with a public random number",
  ];
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-line bg-surface/70 py-4" aria-label="Recent winners and facts">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap hover:[animation-play-state:paused]">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-10 text-[15px] text-ink/70" aria-hidden={i >= items.length}>
            {t}
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function HowItWorks({ current }: { current: DrawView | null }) {
  const today = (new Date().getUTCDay() + 6) % 7;
  return (
    <section id="how" className="container py-28">
      <Reveal className="max-w-2xl">
        <h2 className="display text-[clamp(2.6rem,5.5vw,4.25rem)]">A week at the pot</h2>
        <p className="mt-5 text-lg text-ink/70">
          Every draw runs Monday to Monday, in UTC. Here&apos;s what happens, and when.
        </p>
      </Reveal>

      <Reveal delay={100} className="mt-16">
        <ol className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {DAYS.map((d, i) => (
            <li key={d} className="text-center">
              <div
                className={`h-2 rounded-full transition-colors ${
                  i < today ? "bg-ink/80" : i === today ? "bg-accent" : "bg-line"
                }`}
              />
              <p className={`mt-3 text-sm ${i === today ? "font-medium text-ink" : "text-muted"}`}>{d}</p>
            </li>
          ))}
        </ol>
        {current && (
          <p className="mt-4 text-sm text-muted">
            It&apos;s {DAYS[today]} now. This draw closes in <TimeLeft to={current.draw.closes_at} />.
          </p>
        )}
      </Reveal>

      <div className="mt-20 grid gap-14 md:grid-cols-3 md:gap-10">
        <Step n="1" when="Monday, 00:00" title="The draw opens" delay={0}>
          We lock in a secret number and publish its fingerprint, plus which public random number we&apos;ll use at the
          end. Neither can change after this.
        </Step>
        <Step n="2" when="Every day" title="You enter, free" delay={120}>
          Sign in with your email and tap enter. One entry a day, so seven chances a week. You never pay, and you never
          have to watch or click an ad.
        </Step>
        <Step n="3" when="Next Monday, 00:01" title="One winner takes it all" delay={240}>
          Entries close, a public random number is released a minute later, and the two together pick the winner. They
          get the whole pot.
        </Step>
      </div>
    </section>
  );
}

function Step({
  n,
  when,
  title,
  delay,
  children,
}: {
  n: string;
  when: string;
  title: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <Reveal delay={delay}>
      <p className="font-serif text-7xl leading-none text-accent [-webkit-text-stroke:1px_rgb(var(--ink)/0.15)]">{n}</p>
      <p className="mt-6 text-sm text-muted">{when}</p>
      <h3 className="mt-1 text-xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-3 leading-relaxed text-ink/70">{children}</p>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */

function Money({ current }: { current: DrawView | null }) {
  const pot = current?.pot;
  const cur = current?.draw.currency ?? "USD";
  return (
    <section className="border-y border-line bg-surface/60">
      <div className="container grid items-center gap-16 py-28 lg:grid-cols-2">
        <Reveal>
          <h2 className="display text-[clamp(2.6rem,5.5vw,4.25rem)]">
            Where every dollar
            <br />
            comes from
          </h2>
          <div className="mt-8 max-w-md space-y-5 text-lg leading-relaxed text-ink/70">
            <p>
              <span className="text-ink">Sponsors</span>{" "}put their name on a week, and their money goes straight into
              that week&apos;s pot.
            </p>
            <p>
              <span className="text-ink">Ads</span>{" "}on this site earn revenue. {AD_SHARE_PERCENT}% of it goes into the
              pot; the rest keeps the site running.
            </p>
            <p>
              <span className="text-ink">Unclaimed prizes</span>{" "}roll over. A winner has {CLAIM_WINDOW_DAYS} days to
              claim, then the money joins the next pot.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120} className="mx-auto w-full max-w-md">
          <div className="receipt rotate-[1deg] bg-bg px-8 pt-8 font-mono text-sm shadow-[0_24px_50px_-28px_rgb(0_0_0/0.35)]">
            <p className="text-center font-serif text-2xl">This week&apos;s ledger</p>
            <p className="mt-1 text-center text-xs text-muted">
              {current ? `${weekLabel(current.draw.week_start)} · updated live` : "loading…"}
            </p>
            <div className="my-6 border-t border-dashed border-line" />
            <ul className="space-y-3">
              <li className="leader">
                <span>Sponsor{current?.sponsor ? ` · ${current.sponsor.name}` : ""}</span>
                <span className="num">{formatMoney(pot?.sponsor ?? 0, cur, true)}</span>
              </li>
              <li className="leader">
                <span>Ads · {AD_SHARE_PERCENT}% share</span>
                <span className="num">{formatMoney(pot?.ads ?? 0, cur, true)}</span>
              </li>
              <li className="leader">
                <span>Rolled over</span>
                <span className="num">{formatMoney(pot?.rollover ?? 0, cur, true)}</span>
              </li>
            </ul>
            <div className="my-6 border-t border-dashed border-line" />
            <div className="flex items-baseline justify-between">
              <span>Total pot</span>
              <span className="num font-serif text-3xl">{formatMoney(pot?.total ?? 0, cur, true)}</span>
            </div>
            {current && (
              <Link href={`/draw/?id=${current.draw.id}`} className="mt-6 inline-flex items-center gap-1 text-xs text-muted underline-offset-4 hover:text-ink hover:underline">
                Every line item, with notes <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Fairness({ current, last }: { current: DrawView | null; last: DrawView | null }) {
  return (
    <section id="fair" className="border-y border-line bg-[#171612] text-[#F4F1E8]">
      <div className="container py-28">
        <Reveal className="max-w-3xl">
          <h2 className="display text-[clamp(2.6rem,5.5vw,4.25rem)]">
            Nobody picks the winner.
            <br />
            <em className="opacity-60">Not even us.</em>
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed opacity-70">
            The winner comes from two numbers: a secret one we commit to before anyone enters, and a public one from
            the{" "}
            <a href="https://drand.love" target="_blank" rel="noreferrer" className="underline underline-offset-4">
              drand
            </a>{" "}
            beacon that nobody knows until after entries close. Every draw publishes both, so anyone can redo the maths.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl bg-white/15 md:grid-cols-2">
          <Reveal className="bg-[#171612] p-8">
            <p className="text-sm opacity-60">Published before this week&apos;s first entry</p>
            <p className="mt-5 text-sm opacity-60">Fingerprint of the secret</p>
            <p className="mt-1 break-all font-mono text-sm">{current?.draw.seed_hash ?? "—"}</p>
            <p className="mt-5 text-sm opacity-60">Public random number to use</p>
            <p className="mt-1 font-mono text-sm">
              {current
                ? `drand round ${Number(current.draw.randomness_round).toLocaleString("en-US")}, out ${formatUtc(drandRoundTime(current.draw.randomness_round))}`
                : "—"}
            </p>
          </Reveal>
          <Reveal delay={120} className="bg-[#171612] p-8">
            <p className="text-sm opacity-60">Revealed after the draw</p>
            {last ? (
              <>
                <p className="mt-5 text-sm opacity-60">The secret, {weekLabel(last.draw.week_start)}</p>
                <p className="mt-1 break-all font-mono text-sm">{last.draw.seed}</p>
                <p className="mt-5 text-sm opacity-60">Result</p>
                <p className="mt-1 font-mono text-sm">
                  entry #{last.draw.winner_index ?? "—"} of {(last.draw.total_entries ?? 0).toLocaleString("en-US")}
                </p>
                <Link href={`/draw/?id=${last.draw.id}`} className="btn mt-8 h-10 bg-[#F4F1E8] px-5 text-[#171612] hover:opacity-90">
                  Check last week&apos;s draw <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <p className="mt-5 opacity-70">The first draw is revealed next Monday.</p>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function LastWinner({ view }: { view: DrawView }) {
  const { draw, winner } = view;
  return (
    <section className="container py-28 text-center">
      <Reveal>
        <p className="text-muted">Last Monday</p>
        <p className="display mx-auto mt-6 max-w-4xl text-[clamp(2.4rem,6vw,4.75rem)]">
          {winner!.name}
          {winner!.country && <span className="text-ink/50"> from {countryName(winner!.country)}</span>} took home{" "}
          <span className="num whitespace-nowrap bg-accent px-2 text-accent-ink [box-decoration-break:clone]">
            {formatMoney(draw.prize_amount ?? 0, draw.currency, true)}
          </span>
        </p>
        <p className="mt-8 text-muted">
          {(draw.total_entries ?? 0).toLocaleString("en-US")} entries · {weekLabel(draw.week_start)} ·{" "}
          <Link href="/results/" className="text-ink underline underline-offset-4">
            all winners
          </Link>
        </p>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Sponsor() {
  return (
    <section className="container pb-8">
      <Reveal className="grid items-center gap-8 overflow-hidden rounded-[28px] bg-accent p-10 text-accent-ink md:grid-cols-[1.4fr_1fr] md:p-14">
        <div>
          <h2 className="display text-[clamp(2.2rem,4.5vw,3.5rem)]">Put your name on the pot</h2>
          <p className="mt-4 max-w-lg text-lg opacity-75">
            Sponsor a week. Your prize money goes in the pot, and your name goes on the ticket everyone sees when they
            enter.
          </p>
        </div>
        <div className="md:text-right">
          <a href={`mailto:${SPONSOR_CONTACT}?subject=Sponsoring%20a%20week`} className="btn btn-lg bg-accent-ink text-accent hover:opacity-90">
            Sponsor a week <ArrowUpRight className="h-4 w-4" />
          </a>
          <p className="mt-3 text-sm opacity-60">{SPONSOR_CONTACT}</p>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */

const FAQ: [string, React.ReactNode][] = [
  [
    "Is it really free?",
    "Yes. There is nothing to buy and no way to pay. Entering costs nothing, and paying wouldn't improve your chances because there's nothing to pay for.",
  ],
  [
    "Do I have to watch or click ads?",
    `No. Ads are shown around the site and ${AD_SHARE_PERCENT}% of what they earn goes into the pot, but entering never depends on them.`,
  ],
  [
    "What are my chances?",
    "Every entry has the same chance: one divided by the total number of entries that week. Entering every day gives you up to seven entries.",
  ],
  [
    "How do I get paid if I win?",
    `We email you and it shows on your account page. You have ${CLAIM_WINDOW_DAYS} days to claim. We check your ID, then pay by bank transfer, PayPal or Wise.`,
  ],
  [
    "Who can enter?",
    `Anyone ${MIN_AGE} or older, one account per person, except residents of ${EXCLUDED_COUNTRIES.map(countryName).join(", ")} or anywhere the draw is restricted by law.`,
  ],
  [
    "How can I check the draw was fair?",
    <>
      Every draw page shows the secret, the public random number, the full entry list and the few lines of code that
      pick the winner. Run them yourself and you&apos;ll get the same result.{" "}
      <Link href="/rules/" className="underline underline-offset-4">
        Read the official rules
      </Link>
      .
    </>,
  ],
];

function Faq() {
  return (
    <section className="container grid gap-12 py-28 lg:grid-cols-[1fr_1.6fr]">
      <Reveal>
        <h2 className="display text-[clamp(2.6rem,5.5vw,4.25rem)]">Questions</h2>
        <p className="mt-4 text-ink/70">The short answers. The long ones are in the rules.</p>
      </Reveal>
      <Reveal delay={100} className="divide-y divide-line border-y border-line">
        {FAQ.map(([q, a]) => (
          <details key={q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-lg font-medium [&::-webkit-details-marker]:hidden">
              {q}
              <Plus className="h-5 w-5 shrink-0 text-muted transition-transform duration-300 group-open:rotate-45" />
            </summary>
            <p className="-mt-1 max-w-2xl pb-6 leading-relaxed text-ink/70">{a}</p>
          </details>
        ))}
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function FinalCall({ current }: { current: DrawView | null }) {
  return (
    <section className="border-t border-line">
      <Reveal className="container flex flex-col items-center py-28 text-center">
        <h2 className="display max-w-3xl text-[clamp(2.6rem,6vw,5rem)]">
          {current ? (
            <>
              <CountUp value={current.pot.total} currency={current.draw.currency} /> and counting.
            </>
          ) : (
            "This week's pot is open."
          )}
        </h2>
        <p className="mt-5 text-lg text-ink/70">
          {current ? (
            <>
              Entries close in <TimeLeft to={current.draw.closes_at} />. It takes ten seconds.
            </>
          ) : (
            "It takes ten seconds."
          )}
        </p>
        <a href="#enter" className="btn-dark btn-lg mt-10">
          Enter free
        </a>
      </Reveal>
    </section>
  );
}
