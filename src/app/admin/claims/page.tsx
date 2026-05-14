import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClaimAdminForm } from "@/components/admin/claim-admin-form";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";
import type { WinnerClaim } from "@/lib/types";

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
    (profiles ?? []).map((p) => [p.id, p as { id: string; email: string; country_code: string }]),
  );

  const drawIds = Array.from(new Set(claims.map((c) => c.draw_id)));
  const { data: draws } = drawIds.length
    ? await admin
        .from("draws")
        .select("id, title")
        .in("id", drawIds)
    : { data: [] };
  const drawsById = new Map(
    (draws ?? []).map((d) => [d.id, d as { id: string; title: string }]),
  );

  return (
    <div className="space-y-3">
      {claims.map((c) => {
        const p = profilesById.get(c.user_id);
        const d = drawsById.get(c.draw_id);
        return (
          <Card key={c.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>
                  <Link className="hover:underline" href={`/admin/draws/${c.draw_id}`}>
                    {d?.title ?? c.draw_id}
                  </Link>
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Winner: {p?.email ?? c.user_id} ({p?.country_code ?? "—"}) ·{" "}
                  {formatDateTime(c.created_at)}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="info">{c.claim_status}</Badge>
                <Badge variant="default">payout: {c.payout_status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ClaimAdminForm claim={c} />
            </CardContent>
          </Card>
        );
      })}
      {claims.length === 0 && (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">
          No winner claims yet.
        </CardContent></Card>
      )}
    </div>
  );
}
