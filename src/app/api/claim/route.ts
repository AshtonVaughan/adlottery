import { requireSessionApi, fail, json, readJson } from "@/lib/api";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { claimSchema, firstError } from "@/lib/validation";

export async function POST(request: Request) {
  const guard = await requireSessionApi();
  if (!guard.ok) return guard.response;

  const parsed = claimSchema.safeParse(await readJson(request));
  if (!parsed.success) return fail(firstError(parsed.error));

  const { data, error } = await getSupabaseAdminClient()
    .from("winners")
    .update({
      status: "claimed",
      legal_name: parsed.data.legal_name,
      payout_details: parsed.data.payout_details,
      claimed_at: new Date().toISOString(),
    })
    .eq("draw_id", parsed.data.draw_id)
    .eq("user_id", guard.session.userId)
    .eq("status", "pending")
    .gt("claim_deadline", new Date().toISOString())
    .select("draw_id");
  if (error) return fail("Could not submit your claim.", 500);
  if (!data?.length) return fail("This prize can't be claimed (already claimed or expired).");
  return json({ ok: true });
}
