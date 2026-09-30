import { requireAdminApi, fail, json, readJson } from "@/lib/api";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sponsorSchema, firstError } from "@/lib/validation";

export async function POST(request: Request) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const parsed = sponsorSchema.safeParse(await readJson(request));
  if (!parsed.success) return fail(firstError(parsed.error));
  const { draw_id, name, url, tagline } = parsed.data;

  const db = getSupabaseAdminClient();
  const { data: sponsor, error } = await db
    .from("sponsors")
    .insert({ name, url: url || null, tagline: tagline || null })
    .select("id")
    .single();
  if (error) return fail(error.message, 500);

  const { error: linkError } = await db.from("draws").update({ sponsor_id: sponsor.id }).eq("id", draw_id);
  if (linkError) return fail(linkError.message, 500);
  return json({ ok: true });
}
