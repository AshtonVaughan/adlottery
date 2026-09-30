import { requireAdminApi, fail, json, readJson } from "@/lib/api";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { banSchema, firstError } from "@/lib/validation";

export async function POST(request: Request) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const parsed = banSchema.safeParse(await readJson(request));
  if (!parsed.success) return fail(firstError(parsed.error));

  const { data, error } = await getSupabaseAdminClient()
    .from("profiles")
    .update({ banned_at: parsed.data.banned ? new Date().toISOString() : null })
    .eq("email", parsed.data.email)
    .select("id");
  if (error) return fail(error.message, 500);
  if (!data?.length) return fail("No account with that email.", 404);
  return json({ ok: true });
}
