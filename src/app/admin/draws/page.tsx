import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Draws</h2>
          <p className="text-sm text-muted-foreground">
            Manage the lifecycle of every draw.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/draws/new">
            <Plus className="h-4 w-4" /> New draw
          </Link>
        </Button>
      </div>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                  <th className="py-3 pl-5 pr-3 font-medium">Draw</th>
                  <th className="py-3 pr-3 font-medium">Status</th>
                  <th className="py-3 pr-3 font-medium">Prize</th>
                  <th className="py-3 pr-3 font-medium">Window</th>
                  <th className="py-3 pr-5 font-medium text-right">Open</th>
                </tr>
              </thead>
              <tbody>
                {draws.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="py-3 pl-5 pr-3">
                      <Link
                        href={`/admin/draws/${d.id}`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {d.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {d.draw_type.replace(/_/g, " ")}
                      </p>
                    </td>
                    <td className="py-3 pr-3">
                      <Badge variant={statusVariant(d.status)}>{d.status}</Badge>
                    </td>
                    <td className="stat py-3 pr-3 font-medium">
                      {formatCurrency(Number(d.prize_amount), d.currency)}
                    </td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground">
                      {formatDateTime(d.starts_at)}
                      <br />→ {formatDateTime(d.ends_at)}
                    </td>
                    <td className="py-3 pr-5 text-right">
                      <Link
                        href={`/admin/draws/${d.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                        aria-label="Open draw"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {draws.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No draws yet. Create one to get started.
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

function statusVariant(
  status: string,
): "success" | "warning" | "danger" | "info" | "default" {
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
