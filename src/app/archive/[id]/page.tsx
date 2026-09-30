import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatCurrency, formatDateTime, maskEntryId } from "@/lib/utils";
import { drandRoundUrl } from "@/lib/drand";
import type { Draw, Jurisdiction, WinnerClaim } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DrawResultPage({ params }: PageProps) {
  const { id } = await params;
  const admin = getSupabaseAdminClient();
  const { data: draw } = await admin
    .from("draws")
    .select("*")
    .eq("id", id)
    .maybeSingle<Draw>();

  if (!draw) notFound();

  const { count } = await admin
    .from("entries")
    .select("id", { head: true, count: "exact" })
    .eq("draw_id", draw.id);

  const { data: claim } = await admin
    .from("winner_claims")
    .select("*")
    .eq("draw_id", draw.id)
    .maybeSingle<WinnerClaim>();

  let displayMode: "full" | "partial" | "anonymous" = "anonymous";
  let winnerCountry: string | null = null;
  if (claim) {
    const { data: winnerProfile } = await admin
      .from("profiles")
      .select("country_code")
      .eq("id", claim.user_id)
      .maybeSingle();
    winnerCountry = winnerProfile?.country_code ?? null;
    if (winnerCountry) {
      const { data: j } = await admin
        .from("jurisdictions")
        .select("public_winner_display_mode")
        .eq("country_code", winnerCountry)
        .maybeSingle<Pick<Jurisdiction, "public_winner_display_mode">>();
      if (j) displayMode = j.public_winner_display_mode;
    }
  }

  return (
    <div className="container max-w-4xl py-16">
      <div className="space-y-2">
        <Link
          href="/archive"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Public archive
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {draw.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {draw.draw_type.replace(/_/g, " ")} · drawn{" "}
              {formatDateTime(draw.ends_at)}
            </p>
          </div>
          <Badge variant={draw.status === "drawn" ? "success" : "danger"}>
            {draw.status}
          </Badge>
        </div>
      </div>

      {/* Prize hero */}
      <Card className="mt-8 bg-focal shadow-focal">
        <CardContent className="space-y-2 p-10 text-center">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Prize awarded
          </p>
          <p className="stat text-6xl font-semibold text-glow-primary md:text-7xl">
            {formatCurrency(Number(draw.prize_amount), draw.currency)}
          </p>
          <p className="text-sm text-muted-foreground">
            {(count ?? 0).toLocaleString()} entries · drawn from{" "}
            {draw.eligible_country_codes.length} eligible{" "}
            {draw.eligible_country_codes.length === 1 ? "country" : "countries"}
          </p>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Section title="Fairness proof">
          <Row label="Public seed">
            <Mono>{draw.public_seed ?? "—"}</Mono>
          </Row>
          <Row label="Seed hash">
            <Mono className="text-xs">{draw.public_seed_hash ?? "—"}</Mono>
          </Row>
          <Row label="Beacon round">
            {draw.randomness_round ? (
              <a
                href={drandRoundUrl(draw.randomness_round)}
                className="font-mono text-foreground/90 underline-offset-2 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                drand quicknet #{draw.randomness_round}
              </a>
            ) : (
              <Mono>—</Mono>
            )}
          </Row>
          <Row label="Randomness">
            <Mono className="break-all text-xs">{draw.randomness_source ?? "—"}</Mono>
          </Row>
          <Row label="Winning entry">
            <Mono>
              {draw.winning_entry_id ? maskEntryId(draw.winning_entry_id) : "—"}
            </Mono>
          </Row>
          <p className="pt-2 text-xs text-muted-foreground">
            <span className="text-foreground/80">winner_index</span> ={" "}
            <span className="font-mono">
              sha256(public_seed + &quot;|&quot; + randomness) mod total_entries
            </span>
            . Entries are ordered by created_at then id. Check that
            sha256(public_seed) equals the seed hash published before the
            draw, and that randomness matches the drand round.
          </p>
        </Section>

        <Section title="Winner &amp; payout">
          {!claim ? (
            <p className="text-sm text-muted-foreground">No winner recorded.</p>
          ) : (
            <>
              <Row label="Display mode">{displayMode}</Row>
              <Row label="Winner">
                {displayMode === "anonymous"
                  ? "Anonymous"
                  : `Verified participant${winnerCountry ? ` from ${winnerCountry}` : ""}`}
              </Row>
              <Row label="Claim">
                <Badge variant={claim.claim_status === "verified" ? "success" : "warning"}>
                  {claim.claim_status}
                </Badge>
              </Row>
              <Row label="Payout">
                <Badge variant={claim.payout_status === "paid" ? "success" : "default"}>
                  {claim.payout_status}
                </Badge>
              </Row>
              {claim.payout_reference && (
                <Row label="Reference">
                  <Mono>{claim.payout_reference}</Mono>
                </Row>
              )}
            </>
          )}
        </Section>
      </div>

      <Section className="mt-6" title="Draw metadata">
        <Row label="Started">{formatDateTime(draw.starts_at)}</Row>
        <Row label="Closed">{formatDateTime(draw.ends_at)}</Row>
        <Row label="Published">
          {draw.published_at ? formatDateTime(draw.published_at) : "—"}
        </Row>
        <Row label="Eligible">{draw.eligible_country_codes.join(", ")}</Row>
        {draw.excluded_country_codes.length > 0 && (
          <Row label="Excluded">{draw.excluded_country_codes.join(", ")}</Row>
        )}
        {draw.sponsor_name && <Row label="Sponsor">{draw.sponsor_name}</Row>}
      </Section>
    </div>
  );
}

function Section({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <CardContent className="space-y-3 p-6">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
        <div className="space-y-2 text-sm">{children}</div>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 border-b border-white/[0.04] pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 break-words text-foreground">{children}</span>
    </div>
  );
}

function Mono({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <code className={`font-mono text-foreground/90 ${className ?? ""}`}>
      {children}
    </code>
  );
}
