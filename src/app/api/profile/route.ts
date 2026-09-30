import { requireSessionApi, fail, json, readJson } from "@/lib/api";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { profileSchema, firstError } from "@/lib/validation";
import { RULES_VERSION } from "@/lib/config";

export async function POST(request: Request) {
  const guard = await requireSessionApi();
  if (!guard.ok) return guard.response;

  const parsed = profileSchema.safeParse(await readJson(request));
  if (!parsed.success) return fail(firstError(parsed.error));

  const { profile } = guard.session;
  // Country is fixed once set: changing it could dodge the exclusion list.
  if (profile.country_code && profile.country_code !== parsed.data.country_code) {
    return fail("Contact support to change your country of residence.");
  }

  const { error } = await getSupabaseAdminClient()
    .from("profiles")
    .update({
      display_name: parsed.data.display_name,
      country_code: parsed.data.country_code,
      confirmed_adult_at: profile.confirmed_adult_at ?? new Date().toISOString(),
      accepted_rules_version: RULES_VERSION,
    })
    .eq("id", guard.session.userId);
  if (error) return fail("Could not save your profile.", 500);
  return json({ ok: true });
}
