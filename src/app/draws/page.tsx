import { DrawCard } from "@/components/draw-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { APP_NAME } from "@/lib/constants";
import type { Draw } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DrawsPage() {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("draws")
    .select("*")
    .eq("status", "active")
    .order("ends_at", { ascending: true });

  const draws = (data as Draw[]) ?? [];
  const counts = await Promise.all(
    draws.map(async (d) => {
      const { count } = await admin
        .from("entries")
        .select("id", { head: true, count: "exact" })
        .eq("draw_id", d.id);
      return [d.id, count ?? 0] as const;
    }),
  );
  const countMap = new Map(counts);

  return (
    <div className="container max-w-5xl py-16">
      <div className="max-w-2xl">
        <Badge variant="outline">Active draws</Badge>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          Currently open on {APP_NAME}.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Free entry only. Region availability and eligibility steps appear on
          each draw page.
        </p>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {draws.map((d, i) => (
          <DrawCard
            key={d.id}
            draw={d}
            totalEntries={countMap.get(d.id) ?? 0}
            focal={i === 0 && draws.length === 1}
          />
        ))}
        {draws.length === 0 && (
          <Card>
            <CardContent className="p-10 text-sm text-muted-foreground">
              No active draws right now. The next one will appear here.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
