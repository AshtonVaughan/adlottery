import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BanUserForm } from "@/components/admin/ban-user-form";
import { JurisdictionBadge } from "@/components/jurisdiction-badge";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  const users = (data as Profile[]) ?? [];

  return (
    <Card>
      <CardHeader><CardTitle>Users</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Country</th>
                <th className="py-2 pr-3">Eligibility</th>
                <th className="py-2 pr-3">Admin</th>
                <th className="py-2 pr-3">Joined</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-border/60">
                  <td className="py-1.5 pr-3 font-medium">{u.email}</td>
                  <td className="py-1.5 pr-3">{u.country_code}</td>
                  <td className="py-1.5 pr-3">
                    <JurisdictionBadge status={u.eligibility_status} />
                  </td>
                  <td className="py-1.5 pr-3">
                    {u.is_admin ? <Badge variant="info">admin</Badge> : "—"}
                  </td>
                  <td className="py-1.5 pr-3 text-xs text-muted-foreground">
                    {formatDateTime(u.created_at)}
                  </td>
                  <td className="py-1.5 pr-3">
                    {u.banned_at ? <Badge variant="danger">banned</Badge> : <Badge variant="success">active</Badge>}
                  </td>
                  <td className="py-1.5 pr-3 text-right">
                    <BanUserForm userId={u.id} banned={!!u.banned_at} />
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={7} className="py-4 text-center text-muted-foreground">No users yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
