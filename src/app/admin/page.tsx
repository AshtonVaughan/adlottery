import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function loadStats() {
  const admin = getSupabaseAdminClient();
  const [users, draws, openFraud, openClaims] = await Promise.all([
    admin.from("profiles").select("id", { head: true, count: "exact" }),
    admin
      .from("draws")
      .select("id", { head: true, count: "exact" })
      .eq("status", "active"),
    admin
      .from("fraud_flags")
      .select("id", { head: true, count: "exact" })
      .eq("status", "open"),
    admin
      .from("winner_claims")
      .select("id", { head: true, count: "exact" })
      .in("claim_status", [
        "verification_required",
        "skill_question_required",
        "pending",
      ]),
  ]);
  return {
    users: users.count ?? 0,
    activeDraws: draws.count ?? 0,
    openFraud: openFraud.count ?? 0,
    openClaims: openClaims.count ?? 0,
  };
}

export default async function AdminOverviewPage() {
  const stats = await loadStats();
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Users" value={stats.users} />
        <StatCard label="Active draws" value={stats.activeDraws} />
        <StatCard label="Open winner claims" value={stats.openClaims} />
        <StatCard label="Open fraud flags" value={stats.openFraud} />
      </div>
      <Card>
        <CardHeader><CardTitle>Quick actions</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild><Link href="/admin/draws/new">Create draw</Link></Button>
          <Button asChild variant="outline"><Link href="/admin/draws">Manage draws</Link></Button>
          <Button asChild variant="outline"><Link href="/admin/claims">Review claims</Link></Button>
          <Button asChild variant="outline"><Link href="/admin/jurisdictions">Manage jurisdictions</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader><CardTitle>{label}</CardTitle></CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}
