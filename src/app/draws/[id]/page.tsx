import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/countdown";
import { ClaimEntryButton } from "@/components/claim-entry-button";
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

  if (session) {
    const { data: jurisdiction } = await admin
      .from("jurisdictions")
      .select("*")
      .eq("country_code", session.profile.country_code)
      .maybeSingle<Jurisdiction>();
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
    <div className="container max-w-4xl py-12">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {draw.draw_type.replace(/_/g, " ")}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {draw.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Eligible countries:{" "}
            <span className="text-foreground">{draw.eligible_country_codes.join(", ")}</span>
          </p>
        </div>
        <Badge variant={draw.status === "active" ? "success" : "default"}>
          {draw.status}
        </Badge>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Prize &amp; window</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="text-3xl font-semibold">
              {formatCurrency(Number(draw.prize_amount), draw.currency)}
            </div>
            <Countdown to={draw.ends_at} />
            <p className="text-xs text-muted-foreground">
              Starts {formatDateTime(draw.starts_at)} · Ends {formatDateTime(draw.ends_at)}
            </p>
            <p className="text-xs text-muted-foreground">
              Total entries: <span className="text-foreground">{(totalEntries ?? 0).toLocaleString()}</span>
            </p>
            {session && (
              <p className="text-xs text-muted-foreground">
                Your entries: <span className="text-foreground">{userEntryCount}</span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Claim free entry</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {!session ? (
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  Sign up free to claim a daily entry. No purchase required.
                </p>
                <Link
                  href="/signup"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Create free account
                </Link>
              </div>
            ) : !canEnter ? null : canEnter.ok ? (
              <ClaimEntryButton
                drawId={draw.id}
                disabled={alreadyToday}
                disabledReason={alreadyToday ? "Daily entry already claimed today." : undefined}
              />
            ) : (
              <ClaimEntryButton drawId={draw.id} disabled disabledReason={canEnter.reason} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle>Rules summary &amp; fairness method</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Free to enter. One daily free entry per eligible account per draw.
            Referral bonus entries awarded after a referred user claims their
            first valid daily entry.
          </p>
          <p>
            Winner is selected deterministically:
          </p>
          <pre className="rounded-md border border-border/60 bg-secondary/60 p-3 text-xs">
winner_index = sha256(public_seed + randomness_source) mod total_entries
          </pre>
          <p>
            Entries are ordered by created_at then id. Once the draw is closed,
            the seed, hash, and randomness source are published in the{" "}
            <Link href="/archive" className="text-primary hover:underline">
              public archive
            </Link>{" "}
            so anyone can verify the result.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
