import { Card, CardContent } from "@/components/ui/card";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface AuditLogRow {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export default async function AdminAuditPage() {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  const logs = (data as AuditLogRow[]) ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Audit log</h2>
        <p className="text-sm text-muted-foreground">
          Latest 200 privileged actions. Read-only.
        </p>
      </div>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                  <th className="py-3 pl-5 pr-3 font-medium">When</th>
                  <th className="py-3 pr-3 font-medium">Actor</th>
                  <th className="py-3 pr-3 font-medium">Action</th>
                  <th className="py-3 pr-3 font-medium">Entity</th>
                  <th className="py-3 pr-5 font-medium">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-white/[0.04] last:border-0 align-top hover:bg-white/[0.02]"
                  >
                    <td className="py-2 pl-5 pr-3 text-xs text-muted-foreground">
                      {formatDateTime(l.created_at)}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">
                      {l.actor_user_id ? l.actor_user_id.slice(0, 8) + "…" : "—"}
                    </td>
                    <td className="py-2 pr-3 font-medium">{l.action}</td>
                    <td className="py-2 pr-3 text-xs">
                      {l.entity_type ?? "—"}{" "}
                      {l.entity_id && (
                        <span className="font-mono text-muted-foreground">
                          {l.entity_id.slice(0, 8)}…
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-5 text-xs">
                      <pre className="max-w-md overflow-x-auto whitespace-pre-wrap break-words font-mono text-foreground/80">
                        {l.metadata ? JSON.stringify(l.metadata) : "—"}
                      </pre>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No audit logs yet.
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
