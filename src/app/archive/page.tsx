import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <div className="container py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Public draw archive</h1>
      <p className="mt-2 text-muted-foreground">
        Every completed draw. Click through for the verifiable winning entry.
      </p>

      <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {draws.map((d) => (
          <Card key={d.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>{d.title}</CardTitle>
                <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                  {d.draw_type.replace(/_/g, " ")}
                </p>
              </div>
              <Badge variant={d.status === "drawn" ? "success" : "danger"}>
                {d.status}
              </Badge>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="text-2xl font-semibold tracking-tight">
                {formatCurrency(Number(d.prize_amount), d.currency)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Drawn {formatDate(d.ends_at)}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Region: {d.region_code ?? "Multi-region"} ·{" "}
                {d.eligible_country_codes.length} eligible countries
              </p>
              <Link
                href={`/archive/${d.id}`}
                className="mt-4 inline-block text-sm text-primary hover:underline"
              >
                View fairness proof →
              </Link>
            </CardContent>
          </Card>
        ))}
        {draws.length === 0 && (
          <Card><CardContent className="p-6 text-sm text-muted-foreground">
            No completed draws yet.
          </CardContent></Card>
        )}
      </div>
    </div>
  );
}
