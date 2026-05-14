import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader><CardTitle>Audit logs (latest 200)</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-3">When</th>
                <th className="py-2 pr-3">Actor</th>
                <th className="py-2 pr-3">Action</th>
                <th className="py-2 pr-3">Entity</th>
                <th className="py-2 pr-3">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-border/60 align-top">
                  <td className="py-1.5 pr-3 text-xs text-muted-foreground">
                    {formatDateTime(l.created_at)}
                  </td>
                  <td className="py-1.5 pr-3 text-xs">{l.actor_user_id ?? "—"}</td>
                  <td className="py-1.5 pr-3">{l.action}</td>
                  <td className="py-1.5 pr-3 text-xs">
                    {l.entity_type ?? "—"} {l.entity_id ?? ""}
                  </td>
                  <td className="py-1.5 pr-3 text-xs">
                    <pre className="max-w-md overflow-x-auto whitespace-pre-wrap break-words">
                      {l.metadata ? JSON.stringify(l.metadata, null, 0) : "—"}
                    </pre>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">No audit logs.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
