import { DrawCard } from "@/components/draw-card";
import { Card, CardContent } from "@/components/ui/card";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
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
    <div className="container py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Active draws</h1>
      <p className="mt-2 text-muted-foreground">
        Free entry only. Region availability shown on the draw page.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {draws.map((d) => (
          <DrawCard key={d.id} draw={d} totalEntries={countMap.get(d.id) ?? 0} />
        ))}
        {draws.length === 0 && (
          <Card><CardContent className="p-6 text-sm text-muted-foreground">
            No active draws right now.
          </CardContent></Card>
        )}
      </div>
    </div>
  );
}
