import { Card, CardContent } from "@/components/ui/card";
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
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Fraud queue</h2>
        <p className="text-sm text-muted-foreground">
          Flags don&apos;t auto-ban. Confirm or dismiss after manual review.
        </p>
      </div>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                  <th className="py-3 pl-5 pr-3 font-medium">Reason</th>
                  <th className="py-3 pr-3 font-medium">Severity</th>
                  <th className="py-3 pr-3 font-medium">Status</th>
                  <th className="py-3 pr-3 font-medium">User</th>
                  <th className="py-3 pr-3 font-medium">Entry</th>
                  <th className="py-3 pr-3 font-medium">Created</th>
                  <th className="py-3 pr-5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {flags.map((f) => (
                  <tr
                    key={f.id}
                    className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="py-2 pl-5 pr-3">{f.reason}</td>
                    <td className="py-2 pr-3">
                      <Badge
                        variant={
                          f.severity === "high"
                            ? "danger"
                            : f.severity === "medium"
                            ? "warning"
                            : "default"
                        }
                      >
                        {f.severity}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3">
                      <Badge
                        variant={
                          f.status === "confirmed"
                            ? "danger"
                            : f.status === "dismissed"
                            ? "default"
                            : f.status === "reviewed"
                            ? "info"
                            : "warning"
                        }
                      >
                        {f.status}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">
                      {f.user_id ? f.user_id.slice(0, 8) + "…" : "—"}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">
                      {f.entry_id ? f.entry_id.slice(0, 8) + "…" : "—"}
                    </td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">
                      {formatDateTime(f.created_at)}
                    </td>
                    <td className="py-2 pr-5 text-right">
                      <FraudFlagActions flagId={f.id} status={f.status} />
                    </td>
                  </tr>
                ))}
                {flags.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      The queue is empty.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
