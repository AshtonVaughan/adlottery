import { Card, CardContent } from "@/components/ui/card";
import { JurisdictionForm } from "@/components/admin/jurisdiction-form";
import { JurisdictionBadge } from "@/components/jurisdiction-badge";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Jurisdiction } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminJurisdictionsPage() {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("jurisdictions")
    .select("*")
    .order("display_name", { ascending: true });
  const jurisdictions = (data as Jurisdiction[]) ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Jurisdictions</h2>
        <p className="text-sm text-muted-foreground">
          Per-country eligibility, age, prize cap, permit threshold, and winner
          display rules.
        </p>
      </div>
      <div className="space-y-3">
        {jurisdictions.map((j) => (
          <Card key={j.id}>
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] pb-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {j.country_code} · {j.region_code.replace(/_/g, " ")} ·{" "}
                    {j.currency}
                  </p>
                  <p className="mt-1 text-base font-semibold tracking-tight">
                    {j.display_name}
                  </p>
                </div>
                <JurisdictionBadge status={j.status} />
              </div>
              <JurisdictionForm jurisdiction={j} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
