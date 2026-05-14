import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/countdown";
import { ClaimEntryButton } from "@/components/claim-entry-button";
import { JurisdictionBadge } from "@/components/jurisdiction-badge";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentSession } from "@/lib/auth";
import { canEnterDraw } from "@/lib/jurisdictions";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Draw, Jurisdiction } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DrawDetailPage({ params }: PageProps) {
  const { id } = await params;
  const admin = getSupabaseAdminClient();
  const { data: draw } = await admin
    .from("draws")
    .select("*")
    .eq("id", id)
    .maybeSingle<Draw>();
  if (!draw) notFound();

  const { count: totalEntries } = await admin
    .from("entries")
    .select("id", { head: true, count: "exact" })
    .eq("draw_id", draw.id);

  const session = await getCurrentSession();
  let canEnter: { ok: true } | { ok: false; reason: string } | null = null;
  let userEntryCount = 0;
  let alreadyToday = false;
  let jurisdiction: Jurisdiction | null = null;

  if (session) {
    const jr = await admin
      .from("jurisdictions")
      .select("*")
      .eq("country_code", session.profile.country_code)
      .maybeSingle<Jurisdiction>();
    jurisdiction = jr.data ?? null;
    canEnter = canEnterDraw({
      draw,
      jurisdiction,
      profile: session.profile,
      entrySource: "daily_free_entry",
    });

    const { count } = await admin
      .from("entries")
      .select("id", { head: true, count: "exact" })
      .eq("draw_id", draw.id)
      .eq("user_id", session.userId);
    userEntryCount = count ?? 0;

    const today = new Date().toISOString().slice(0, 10);
    const { data: existing } = await admin
      .from("daily_entry_claims")
      .select("id")
      .eq("user_id", session.userId)
      .eq("draw_id", draw.id)
      .eq("claim_date", today)
      .maybeSingle();
    alreadyToday = !!existing;
  }

  return (
    <div className="container max-w-5xl py-16">
      <div className="space-y-2">
        <Link
          href="/draws"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← All active draws
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge variant={draw.status === "active" ? "success" : "default"}>
              {draw.status === "active" ? "Live" : draw.status}
            </Badge>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              {draw.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {draw.draw_type.replace(/_/g, " ")} ·{" "}
              {draw.eligible_country_codes.length}{" "}
              eligible countries
            </p>
          </div>
          {jurisdiction && (
            <JurisdictionBadge status={jurisdiction.status} />
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card className="bg-focal shadow-focal">
          <CardContent className="space-y-6 p-8">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Prize pool
              </p>
              <p className="stat mt-1 text-5xl font-semibold text-glow-primary md:text-6xl">
                {formatCurrency(Number(draw.prize_amount), draw.currency)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Funded by the platform &amp; sponsors · No purchase required
              </p>
            </div>
            {draw.status === "active" && (
              <Countdown to={draw.ends_at} size="lg" />
            )}
            <div className="grid grid-cols-2 gap-6 border-t border-white/[0.05] pt-5">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  Total entries
                </p>
                <p className="stat mt-1 text-2xl font-medium">
                  {(totalEntries ?? 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  Your entries
                </p>
                <p className="stat mt-1 text-2xl font-medium">
                  {session ? userEntryCount : "—"}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Starts {formatDateTime(draw.starts_at)} · Ends{" "}
              {formatDateTime(draw.ends_at)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Claim free entry
            </p>
            {!session ? (
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Free account, no payment. We&apos;ll check eligibility for
                  your country before you can claim.
                </p>
                <Button asChild className="w-full">
                  <Link href="/signup">Create free account</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">Log in</Link>
                </Button>
              </div>
            ) : !canEnter ? null : canEnter.ok ? (
              <ClaimEntryButton
                drawId={draw.id}
                disabled={alreadyToday}
                disabledReason={
                  alreadyToday ? "You already claimed today. Come back tomorrow." : undefined
                }
              />
            ) : (
              <ClaimEntryButton drawId={draw.id} disabled disabledReason={canEnter.reason} />
            )}
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>One daily entry per draw per day</li>
              <li>Referral bonus on a referred user&apos;s first claim</li>
              <li>Promo codes when offered</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardContent className="space-y-4 p-6 text-sm">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Fairness method
          </p>
          <pre className="overflow-x-auto rounded-md border border-white/[0.06] bg-white/[0.02] p-4 font-mono text-xs leading-relaxed text-foreground/90">
{`winner_index = sha256(public_seed + randomness_source) mod total_entries`}
          </pre>
          <p className="text-muted-foreground">
            Entries are ordered by created_at then id. After the draw closes
            we publish the seed, hash, and randomness source in the{" "}
            <Link
              href="/archive"
              className="text-foreground underline-offset-2 hover:underline"
            >
              public archive
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
