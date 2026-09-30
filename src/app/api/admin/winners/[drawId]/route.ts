import { requireAdminApi, fail, json, readJson } from "@/lib/api";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { winnerUpdateSchema, firstError } from "@/lib/validation";
import { forfeitExpiredPrizes } from "@/lib/draw";
import type { WinnerStatus } from "@/lib/types";

// Allowed admin transitions. Forfeiting rolls the prize into the current pot.
const FROM: Record<"verified" | "paid" | "forfeited", WinnerStatus[]> = {
  verified: ["claimed"],
  paid: ["verified"],
  forfeited: ["pending", "claimed", "verified"],
};

export async function POST(request: Request, ctx: { params: Promise<{ drawId: string }> }) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  const { drawId } = await ctx.params;

  const parsed = winnerUpdateSchema.safeParse(await readJson(request));
  if (!parsed.success) return fail(firstError(parsed.error));
  const { status, payout_reference } = parsed.data;
  if (status === "paid" && !payout_reference) return fail("Add the payout reference.");

  const db = getSupabaseAdminClient();

  if (status === "forfeited") {
    // Expire the claim now and let the normal forfeit path roll it over.
    const { data } = await db
      .from("winners")
      .update({ status: "pending", claim_deadline: new Date(0).toISOString() })
      .eq("draw_id", drawId)
      .in("status", FROM.forfeited)
      .select("draw_id");
    if (!data?.length) return fail("Prize can't be forfeited from its current state.");
    await forfeitExpiredPrizes();
    return json({ ok: true });
  }

  const { data, error } = await db
    .from("winners")
    .update({
      status,
      ...(status === "paid" ? { payout_reference, paid_at: new Date().toISOString() } : {}),
    })
    .eq("draw_id", drawId)
    .in("status", FROM[status])
    .select("draw_id");
  if (error) return fail(error.message, 500);
  if (!data?.length) return fail(`Can't mark as ${status} from the current state.`);
  return json({ ok: true });
}
