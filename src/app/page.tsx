import Link from "next/link";
import { ArrowRight, Check, Globe2, ShieldCheck, Sparkles } from "lucide-react";
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

export default async function HomePage() {
  const { draw, totalEntries } = await loadFeaturedDraw();

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border/60">
        <div className="container grid gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div className="flex flex-col justify-center">
            <Badge variant="info" className="w-fit">No purchase required</Badge>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Enter free prize draws from anywhere we&apos;re open.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {BRAND.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/signup">
                  Claim your free entry <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/regions">Check region availability</Link>
              </Button>
            </div>
            <ul className="mt-8 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {TRUST_BULLETS.map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" /> {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            {draw ? (
              <DrawCard draw={draw} totalEntries={totalEntries} />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    A new free prize draw is coming soon.
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/signup">Get notified</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
            <p className="text-center text-xs text-muted-foreground">
              Draw availability and rules depend on your region. See the regions page.
            </p>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            How {APP_NAME} works
          </h2>
          <p className="mt-2 text-muted-foreground">
            Free to enter. Transparent draws. Verified winners.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Card key={s.title}>
              <CardContent className="p-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-primary ring-1 ring-inset ring-primary/30">
                  <s.icon className="h-4 w-4" />
                </div>
                <p className="mt-4 text-sm font-semibold text-muted-foreground">
                  Step {i + 1}
                </p>
                <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.copy}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-border/60 bg-card/40">
        <div className="container py-16">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline">Trust &amp; transparency</Badge>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
              Public draws, anonymised winners, verifiable seeds.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Every draw publishes a public seed, a seed hash, a randomness
              source, and the total entries. Anyone can verify the winning
              selection from the archive — no purchase, no payment, no opaque
              picks.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild variant="outline">
                <Link href="/archive">View public archive</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/legal/draw-rules">Read the draw rules</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

const TRUST_BULLETS = [
  "Free to enter",
  "No purchase required",
  "Public draw results",
  "Winner verification",
  "Region-based eligibility",
  "Transparent draw method",
];

const STEPS = [
  {
    title: "Sign up free",
    copy: "Pick your country, confirm you're eligible, and accept the regional rules. No payment required, ever.",
    icon: Globe2,
  },
  {
    title: "Claim entries",
    copy: "Claim a free entry each day. Invite friends for referral entries. Sponsored draws unlock bonus events.",
    icon: Sparkles,
  },
  {
    title: "Follow public draws",
    copy: "Verifiable seeds, hashed proofs, anonymised winners, and a payout status you can track.",
    icon: ShieldCheck,
  },
];
