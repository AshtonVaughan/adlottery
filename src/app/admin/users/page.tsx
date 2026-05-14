import { Card, CardContent } from "@/components/ui/card";
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
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Users</h2>
        <p className="text-sm text-muted-foreground">
          Latest 200 accounts. Ban and unban toggle eligibility immediately.
        </p>
      </div>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                  <th className="py-3 pl-5 pr-3 font-medium">Email</th>
                  <th className="py-3 pr-3 font-medium">Country</th>
                  <th className="py-3 pr-3 font-medium">Eligibility</th>
                  <th className="py-3 pr-3 font-medium">Role</th>
                  <th className="py-3 pr-3 font-medium">Joined</th>
                  <th className="py-3 pr-3 font-medium">Status</th>
                  <th className="py-3 pr-5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="py-2 pl-5 pr-3 font-medium">{u.email}</td>
                    <td className="py-2 pr-3 font-mono text-xs">
                      {u.country_code}
                    </td>
                    <td className="py-2 pr-3">
                      <JurisdictionBadge status={u.eligibility_status} />
                    </td>
                    <td className="py-2 pr-3">
                      {u.is_admin ? <Badge variant="info">admin</Badge> : "—"}
                    </td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">
                      {formatDateTime(u.created_at)}
                    </td>
                    <td className="py-2 pr-3">
                      {u.banned_at ? (
                        <Badge variant="danger">banned</Badge>
                      ) : (
                        <Badge variant="success">active</Badge>
                      )}
                    </td>
                    <td className="py-2 pr-5 text-right">
                      <BanUserForm userId={u.id} banned={!!u.banned_at} />
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No users yet.
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
