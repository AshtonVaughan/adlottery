import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClaimAdminForm } from "@/components/admin/claim-admin-form";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Draw, WinnerClaim } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminClaimsPage() {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("winner_claims")
    .select("*")
    .order("created_at", { ascending: false });
  const claims = (data as WinnerClaim[]) ?? [];

  const userIds = Array.from(new Set(claims.map((c) => c.user_id)));
  const { data: profiles } = userIds.length
    ? await admin
        .from("profiles")
        .select("id, email, country_code")
        .in("id", userIds)
    : { data: [] };
  const profilesById = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      p as { id: string; email: string; country_code: string },
    ]),
  );

  const drawIds = Array.from(new Set(claims.map((c) => c.draw_id)));
  const { data: draws } = drawIds.length
    ? await admin
        .from("draws")
        .select("id, title, prize_amount, currency")
        .in("id", drawIds)
    : { data: [] };
  const drawsById = new Map(
    (draws ?? []).map((d) => [
      d.id,
      d as Pick<Draw, "id" | "title" | "prize_amount" | "currency">,
    ]),
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Winner claims</h2>
        <p className="text-sm text-muted-foreground">
          Verify, mark payouts paid, and record a payout reference. Updates
          propagate to the public archive.
        </p>
      </div>
      {claims.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No winner claims yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {claims.map((c) => {
            const p = profilesById.get(c.user_id);
            const d = drawsById.get(c.draw_id);
            return (
              <Card key={c.id}>
                <CardContent className="space-y-4 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] pb-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        Draw
                      </p>
                      <Link
                        href={`/admin/draws/${c.draw_id}`}
                        className="mt-1 inline-flex items-baseline gap-2 text-base font-semibold tracking-tight hover:underline"
                      >
                        {d?.title ?? c.draw_id}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {d
                          ? formatCurrency(Number(d.prize_amount), d.currency)
                          : "—"}{" "}
                        · winner {p?.email ?? c.user_id} (
                        {p?.country_code ?? "—"}) ·{" "}
                        {formatDateTime(c.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="warning">{c.claim_status}</Badge>
                      <Badge>payout: {c.payout_status}</Badge>
                    </div>
                  </div>
                  <ClaimAdminForm claim={c} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
