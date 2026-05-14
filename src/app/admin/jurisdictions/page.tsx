import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-3">
      {jurisdictions.map((j) => (
        <Card key={j.id}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>
                {j.display_name} ({j.country_code})
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {j.region_code.replace(/_/g, " ")} · {j.currency}
              </p>
            </div>
            <JurisdictionBadge status={j.status} />
          </CardHeader>
          <CardContent>
            <JurisdictionForm jurisdiction={j} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
