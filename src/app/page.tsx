import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Globe2,
  KeyRound,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DrawCard } from "@/components/draw-card";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { APP_NAME, BRAND } from "@/lib/constants";
import type { Draw } from "@/lib/types";

async function loadFeaturedDraw(): Promise<{
  draw: Draw | null;
  totalEntries: number;
}> {
  try {
    const admin = getSupabaseAdminClient();
    const { data } = await admin
      .from("draws")
      .select("*")
      .eq("status", "active")
      .order("ends_at", { ascending: true })
      .limit(1)
      .maybeSingle<Draw>();

    if (!data) return { draw: null, totalEntries: 0 };
    const { count } = await admin
      .from("entries")
      .select("id", { head: true, count: "exact" })
      .eq("draw_id", data.id);

    return { draw: data, totalEntries: count ?? 0 };
  } catch {
    return { draw: null, totalEntries: 0 };
  }
}

async function loadStats() {
  try {
    const admin = getSupabaseAdminClient();
    const [open, drawn, openCountries] = await Promise.all([
      admin.from("draws").select("id", { head: true, count: "exact" }).eq("status", "active"),
      admin.from("draws").select("id", { head: true, count: "exact" }).eq("status", "drawn"),
      admin
        .from("jurisdictions")
        .select("country_code", { head: true, count: "exact" })
        .eq("status", "open"),
    ]);
    return {
      active: open.count ?? 0,
      drawn: drawn.count ?? 0,
      countries: openCountries.count ?? 0,
    };
  } catch {
    return { active: 0, drawn: 0, countries: 0 };
  }
}

export default async function HomePage() {
  const [{ draw, totalEntries }, stats] = await Promise.all([
    loadFeaturedDraw(),
    loadStats(),
  ]);

  return (
    <>
      {/* HERO ----------------------------------------------------- */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-dot-grid opacity-30 [mask-image:radial-gradient(60%_60%_at_50%_0%,#000_60%,transparent_100%)]"
          aria-hidden
        />
        <div className="container relative grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-xs text-foreground/80">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              Free entry · Public draws · {stats.countries}+ countries open
            </div>
            <h1 className="text-5xl font-semibold leading-[1.05] tracking-tightest text-foreground md:text-6xl">
              Win real prizes.{" "}
              <span className="text-glow-primary">Pay nothing.</span> Ever.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              {BRAND.description}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/signup">
                  Claim your free entry <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/regions">Is my country open?</Link>
              </Button>
            </div>

            <dl className="grid max-w-md grid-cols-3 gap-x-6 gap-y-1 pt-4">
              <Stat label="Open countries" value={stats.countries} />
              <Stat label="Live draws" value={stats.active} />
              <Stat label="Completed" value={stats.drawn} />
            </dl>
          </div>

          <div className="relative">
            {draw ? (
              <DrawCard draw={draw} totalEntries={totalEntries} focal />
            ) : (
              <Card className="bg-focal shadow-focal">
                <CardContent className="space-y-4 p-10 text-center">
                  <Sparkles className="mx-auto h-7 w-7 text-primary" />
                  <h3 className="text-xl font-semibold">
                    The next free prize draw is being prepared
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Create a free account and we&apos;ll notify you the moment
                    it opens.
                  </p>
                  <Button asChild className="mt-2">
                    <Link href="/signup">Get notified</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Region availability and rules vary by country.{" "}
              <Link href="/regions" className="text-foreground/80 underline-offset-2 hover:underline">
                Check yours
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* TRUST BAND ----------------------------------------------- */}
      <section className="border-y border-white/[0.06] bg-white/[0.02]">
        <div className="container grid gap-y-6 py-8 text-sm text-muted-foreground md:grid-cols-3 lg:grid-cols-6">
          {[
            "Free to enter",
            "No purchase required",
            "Public draw archive",
            "Verifiable seed + hash",
            "Region-aware rules",
            "Verified winners",
          ].map((b) => (
            <div key={b} className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <span>{b}</span>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS --------------------------------------------- */}
      <section className="container py-20">
        <div className="mb-12 max-w-2xl">
          <Badge variant="outline">How it works</Badge>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Three steps. Zero payment. Public proof.
          </h2>
          <p className="mt-3 text-muted-foreground">
            {APP_NAME} is built around three commitments: a free way in, a
            transparent draw, and a verified winner. Nothing else.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Step
            number="01"
            icon={Users}
            title="Sign up for free"
            copy="Pick your country, confirm you're eligible, and accept the regional rules. We never ask for payment."
          />
          <Step
            number="02"
            icon={Sparkles}
            title="Claim daily entries"
            copy="One free entry per day per active draw. Invite friends to earn referral entries. Sponsored draws unlock bonus events."
          />
          <Step
            number="03"
            icon={ShieldCheck}
            title="Follow the public draw"
            copy="Each draw publishes a seed, hash, and randomness source. Anyone can re-run the math and verify the winning entry."
          />
        </div>
      </section>

      {/* PROOF ---------------------------------------------------- */}
      <section className="border-t border-white/[0.06] bg-white/[0.02]">
        <div className="container grid gap-12 py-20 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div className="space-y-4">
            <Badge variant="outline">Verifiable fairness</Badge>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Anyone can audit the draw.
            </h2>
            <p className="text-muted-foreground">
              Once a draw closes, we publish the seed, its SHA-256 hash, the
              randomness source we committed to in advance, and the total entry
              count. The winning entry index is a deterministic function of
              those public values — no hidden picks, no silent reruns.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/archive">Browse public archive</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/legal/draw-rules">Read the draw rules</Link>
              </Button>
            </div>
          </div>
          <div>
            <Card className="bg-focal">
              <CardContent className="space-y-5 p-6 font-mono text-xs">
                <div className="flex items-center justify-between text-foreground/60">
                  <span className="text-[11px] uppercase tracking-widest">
                    Draw archive · sample entry
                  </span>
                  <ScrollText className="h-4 w-4" />
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap break-words text-foreground/90">
{`draw_id           = 7bea…c2a0
total_entries     = 14,832
public_seed       = "weekly-draw-2026-05-21"
public_seed_hash  = sha256(seed) = 9f0d…b1c7
randomness_source = bitcoin:block:000…abc
winner_index      = sha256(seed + source) % total_entries
                  = 9_241
status            = drawn · published`}
                </pre>
                <div className="flex items-center gap-2 text-foreground/60">
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Re-runnable by anyone with a hash function.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* GLOBAL CTA ----------------------------------------------- */}
      <section className="container py-20">
        <Card className="relative overflow-hidden bg-focal shadow-focal">
          <div
            className="pointer-events-none absolute inset-0 bg-dot-grid opacity-30"
            aria-hidden
          />
          <div className="relative grid items-center gap-6 p-10 md:grid-cols-[1.4fr_1fr]">
            <div className="space-y-3">
              <Globe2 className="h-7 w-7 text-primary" />
              <h2 className="text-3xl font-semibold tracking-tight">
                Built for the world, region by region.
              </h2>
              <p className="text-muted-foreground">
                We roll out country-by-country with eligibility, age, prize-cap,
                and winner-display rules configured per region. No grey areas,
                no surprises.
              </p>
            </div>
            <div className="flex flex-col gap-2 md:items-end">
              <Button asChild size="lg">
                <Link href="/signup">Create free account</Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/regions">See regional rules</Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <>
      <dt className="row-start-2 text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="stat row-start-1 text-2xl font-semibold text-foreground">
        {value.toLocaleString()}
      </dd>
    </>
  );
}

function Step({
  number,
  icon: Icon,
  title,
  copy,
}: {
  number: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  copy: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <Icon className="h-5 w-5 text-primary" />
          <span className="font-mono text-xs text-muted-foreground">
            {number}
          </span>
        </div>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground">{copy}</p>
      </CardContent>
    </Card>
  );
}
