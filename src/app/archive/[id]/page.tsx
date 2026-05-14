import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatCurrency, formatDate, maskEntryId } from "@/lib/utils";
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
    <div className="container max-w-4xl py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{draw.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {draw.draw_type.replace(/_/g, " ")} · drawn {formatDate(draw.ends_at)}
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Draw metadata</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Prize">{formatCurrency(Number(draw.prize_amount), draw.currency)}</Row>
            <Row label="Status"><Badge variant={draw.status === "drawn" ? "success" : "danger"}>{draw.status}</Badge></Row>
            <Row label="Region">{draw.region_code ?? "Multi-region"}</Row>
            <Row label="Eligible countries">{draw.eligible_country_codes.join(", ")}</Row>
            <Row label="Total entries">{(count ?? 0).toLocaleString()}</Row>
            <Row label="Started">{formatDate(draw.starts_at)}</Row>
            <Row label="Ended">{formatDate(draw.ends_at)}</Row>
            <Row label="Published">{draw.published_at ? formatDate(draw.published_at) : "—"}</Row>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Fairness proof</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Public seed">
              <code className="break-all text-xs">{draw.public_seed ?? "—"}</code>
            </Row>
            <Row label="Public seed hash">
              <code className="break-all text-xs">{draw.public_seed_hash ?? "—"}</code>
            </Row>
            <Row label="Randomness source">
              <code className="break-all text-xs">{draw.randomness_source ?? "—"}</code>
            </Row>
            <Row label="Winning entry id">
              <code className="text-xs">
                {draw.winning_entry_id ? maskEntryId(draw.winning_entry_id) : "—"}
              </code>
            </Row>
            <p className="pt-2 text-xs text-muted-foreground">
              winner_index = sha256(public_seed + randomness_source) mod total_entries.
              Entries are ordered by created_at then id.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle>Winner</CardTitle></CardHeader>
        <CardContent className="text-sm">
          {!claim ? (
            <p className="text-muted-foreground">No winner recorded.</p>
          ) : (
            <>
              <Row label="Display mode">{displayMode}</Row>
              {displayMode === "anonymous" && (
                <Row label="Winner">Anonymous</Row>
              )}
              {displayMode === "partial" && (
                <Row label="Winner">
                  Verified participant {winnerCountry ? `from ${winnerCountry}` : ""}
                </Row>
              )}
              {displayMode === "full" && (
                <Row label="Winner">
                  Verified participant {winnerCountry ? `from ${winnerCountry}` : ""}
                </Row>
              )}
              <Row label="Claim status">{claim.claim_status}</Row>
              <Row label="Payout status">{claim.payout_status}</Row>
              {claim.payout_reference && (
                <Row label="Payout reference">
                  <code className="text-xs">{claim.payout_reference}</code>
                </Row>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="col-span-2 break-words text-foreground">{children}</span>
    </div>
  );
}
