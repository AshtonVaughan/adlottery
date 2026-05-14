import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FraudFlagActions } from "@/components/admin/fraud-flag-actions";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface FraudFlag {
  id: string;
  user_id: string | null;
  entry_id: string | null;
  reason: string;
  severity: "low" | "medium" | "high";
  status: "open" | "reviewed" | "dismissed" | "confirmed";
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export default async function AdminFraudPage() {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("fraud_flags")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  const flags = (data as FraudFlag[]) ?? [];

  return (
    <Card>
      <CardHeader><CardTitle>Fraud flags</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-3">Reason</th>
                <th className="py-2 pr-3">Severity</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">User</th>
                <th className="py-2 pr-3">Entry</th>
                <th className="py-2 pr-3">Created</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {flags.map((f) => (
                <tr key={f.id} className="border-t border-border/60">
                  <td className="py-1.5 pr-3">{f.reason}</td>
                  <td className="py-1.5 pr-3">
                    <Badge variant={f.severity === "high" ? "danger" : f.severity === "medium" ? "warning" : "default"}>
                      {f.severity}
                    </Badge>
                  </td>
                  <td className="py-1.5 pr-3"><Badge>{f.status}</Badge></td>
                  <td className="py-1.5 pr-3 text-xs">{f.user_id ?? "—"}</td>
                  <td className="py-1.5 pr-3 text-xs">{f.entry_id ?? "—"}</td>
                  <td className="py-1.5 pr-3 text-xs text-muted-foreground">
                    {formatDateTime(f.created_at)}
                  </td>
                  <td className="py-1.5 pr-3 text-right">
                    <FraudFlagActions flagId={f.id} status={f.status} />
                  </td>
                </tr>
              ))}
              {flags.length === 0 && (
                <tr><td colSpan={7} className="py-4 text-center text-muted-foreground">No fraud flags.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
