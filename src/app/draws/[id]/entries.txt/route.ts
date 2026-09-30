import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchDrawEntries } from "@/lib/draw";
import { isSupabaseConfigured } from "@/lib/config";

/**
 * The ordered entry list for a drawn draw: one entry id per line, line
 * N (from 0) is index N. No user data is included.
 */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isSupabaseConfigured()) return new Response("Demo mode.\n", { status: 404 });

  const { data: draw } = await getSupabaseAdminClient()
    .from("draws")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (!draw || draw.status !== "drawn") {
    return new Response("The entry list is published once the draw is made.\n", { status: 404 });
  }

  const loaded = await fetchDrawEntries(id);
  if (!loaded.ok) return new Response(`${loaded.reason}\n`, { status: 500 });
  return new Response(loaded.entries.map((e) => e.id).join("\n") + "\n", {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
