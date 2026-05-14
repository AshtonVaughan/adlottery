import Link from "next/link";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JurisdictionBadge } from "@/components/jurisdiction-badge";
import { APP_NAME } from "@/lib/constants";
import type { Jurisdiction } from "@/lib/types";

export const dynamic = "force-dynamic";

async function loadJurisdictions(): Promise<Jurisdiction[]> {
  try {
    const admin = getSupabaseAdminClient();
    const { data } = await admin
      .from("jurisdictions")
      .select("*")
      .order("display_name", { ascending: true });
    return (data as Jurisdiction[]) ?? [];
  } catch {
    return [];
  }
}

export default async function RegionsPage() {
  const jurisdictions = await loadJurisdictions();

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Region availability</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {APP_NAME} is rolling out region-by-region. Open regions can sign up
        today. Restricted regions require extra eligibility steps. Blocked
        regions can join the waitlist for updates.
      </p>

      <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {jurisdictions.map((j) => (
          <Card key={j.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>{j.display_name}</CardTitle>
                <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                  {j.region_code.replace(/_/g, " ")} · {j.currency}
                </p>
              </div>
              <JurisdictionBadge status={j.status} />
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="space-y-1">
                <li>Minimum age: <span className="text-foreground">{j.min_age}+</span></li>
                {j.requires_skill_question && (
                  <li>Requires a skill question before prize claim.</li>
                )}
                {j.prize_cap_amount && (
                  <li>Prize cap: <span className="text-foreground">{j.prize_cap_amount.toLocaleString()} {j.currency}</span></li>
                )}
                {j.requires_permit_above_amount && (
                  <li>
                    Permit threshold:{" "}
                    <span className="text-foreground">
                      {j.requires_permit_above_amount.toLocaleString()} {j.currency}
                    </span>
                  </li>
                )}
                <li>Winner display: <span className="text-foreground">{j.public_winner_display_mode}</span></li>
                {j.notes && <li className="mt-2 text-xs">{j.notes}</li>}
              </ul>
              {j.status === "blocked" ? (
                <Button asChild variant="outline" className="mt-4 w-full">
                  <Link href={`/regions/waitlist?cc=${j.country_code}`}>
                    Join waitlist
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="ghost" className="mt-4 w-full">
                  <Link href="/signup">Sign up</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
        {jurisdictions.length === 0 && (
          <Card><CardContent className="p-6 text-sm text-muted-foreground">
            No jurisdictions configured yet.
          </CardContent></Card>
        )}
      </div>
    </div>
  );
}
