import { type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/lib/admin-guard";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, ctx: RouteParams) {
  const { id } = await ctx.params;
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("entries")
    .select("id, user_id, source, country_code, region_code, created_at")
    .eq("draw_id", id)
    .order("created_at", { ascending: true });

  const rows = data ?? [];
  const header = "id,user_id,source,country,region,created_at\n";
  const csv =
    header +
    rows
      .map(
        (r) =>
          [r.id, r.user_id, r.source, r.country_code, r.region_code, r.created_at]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(","),
      )
      .join("\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="entries-${id}.csv"`,
    },
  });
}
