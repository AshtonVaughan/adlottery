import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Draw } from "@/lib/types";

export const dynamic = "force-dynamic";

async function loadDraws(): Promise<Draw[]> {
  try {
    const admin = getSupabaseAdminClient();
    const { data } = await admin
      .from("draws")
      .select("*")
      .in("status", ["drawn", "cancelled"])
      .order("ends_at", { ascending: false });
    return (data as Draw[]) ?? [];
  } catch {
    return [];
  }
}

export default async function ArchivePage() {
  const draws = await loadDraws();
  return (
    <div className="container max-w-5xl py-16">
      <div className="max-w-2xl">
        <Badge variant="outline">Public archive</Badge>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          Every completed draw.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Click any entry to see the seed, hash, randomness source, total
          entries, and verifiable winning entry id.
        </p>
      </div>

      <div className="mt-10 overflow-hidden rounded-xl border border-white/[0.06] bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-widest text-muted-foreground">
              <th className="py-3 pl-5 pr-3 font-medium">Draw</th>
              <th className="py-3 pr-3 font-medium">Prize</th>
              <th className="py-3 pr-3 font-medium">Closed</th>
              <th className="py-3 pr-3 font-medium">Status</th>
              <th className="py-3 pr-5 font-medium text-right">Proof</th>
            </tr>
          </thead>
          <tbody>
            {draws.map((d) => (
              <tr
                key={d.id}
                className="group border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.02]"
              >
                <td className="py-3 pl-5 pr-3">
                  <Link
                    href={`/archive/${d.id}`}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {d.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {d.draw_type.replace(/_/g, " ")} ·{" "}
                    {d.eligible_country_codes.length} countries
                  </p>
                </td>
                <td className="stat py-3 pr-3 font-medium text-foreground">
                  {formatCurrency(Number(d.prize_amount), d.currency)}
                </td>
                <td className="py-3 pr-3 text-muted-foreground">
                  {formatDate(d.ends_at)}
                </td>
                <td className="py-3 pr-3">
                  <Badge variant={d.status === "drawn" ? "success" : "danger"}>
                    {d.status}
                  </Badge>
                </td>
                <td className="py-3 pr-5 text-right">
                  <Link
                    href={`/archive/${d.id}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                    aria-label="View proof"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {draws.length === 0 && (
          <Card className="border-0 bg-transparent">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No completed draws yet. The first one publishes here as soon as
              it&apos;s run.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
