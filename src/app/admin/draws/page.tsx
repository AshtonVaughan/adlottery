import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Draw } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminDrawsPage() {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("draws")
    .select("*")
    .order("created_at", { ascending: false });
  const draws = (data as Draw[]) ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Draws</CardTitle>
        <Button asChild size="sm"><Link href="/admin/draws/new">New draw</Link></Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-3">Title</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Prize</th>
                <th className="py-2 pr-3">Window</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {draws.map((d) => (
                <tr key={d.id} className="border-t border-border/60">
                  <td className="py-2 pr-3 font-medium">{d.title}</td>
                  <td className="py-2 pr-3">{d.draw_type.replace(/_/g, " ")}</td>
                  <td className="py-2 pr-3">
                    <Badge variant={statusVariant(d.status)}>{d.status}</Badge>
                  </td>
                  <td className="py-2 pr-3">
                    {formatCurrency(Number(d.prize_amount), d.currency)}
                  </td>
                  <td className="py-2 pr-3 text-xs text-muted-foreground">
                    {formatDateTime(d.starts_at)} → {formatDateTime(d.ends_at)}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/draws/${d.id}`}>Manage</Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {draws.length === 0 && (
                <tr><td colSpan={6} className="py-4 text-center text-muted-foreground">No draws yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function statusVariant(status: string): "success" | "warning" | "danger" | "info" | "default" {
  switch (status) {
    case "active":
      return "success";
    case "drawn":
      return "info";
    case "locked":
      return "warning";
    case "cancelled":
      return "danger";
    default:
      return "default";
  }
}
