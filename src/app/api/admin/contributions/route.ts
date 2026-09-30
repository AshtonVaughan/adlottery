import { requireAdminApi, fail, json, readJson } from "@/lib/api";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { contributionSchema, firstError } from "@/lib/validation";
import { adsContribution } from "@/lib/pot";
import { AD_SHARE_PERCENT } from "@/lib/config";
import { formatMoney } from "@/lib/utils";

/** For source "ads", `amount` is gross ad revenue; the pot gets the published share. */
export async function POST(request: Request) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const parsed = contributionSchema.safeParse(await readJson(request));
  if (!parsed.success) return fail(firstError(parsed.error));
  const { draw_id, source, amount, note } = parsed.data;

  const db = getSupabaseAdminClient();
  const { data: draw } = await db.from("draws").select("status, currency").eq("id", draw_id).maybeSingle();
  if (!draw) return fail("Draw not found.", 404);
  if (draw.status !== "open") return fail("Money can only be added to an open draw.");

  const potAmount = source === "ads" ? adsContribution(amount, AD_SHARE_PERCENT) : amount;
  if (potAmount <= 0) return fail("Amount is too small.");
  const autoNote =
    source === "ads"
      ? `${AD_SHARE_PERCENT}% of ${formatMoney(amount, draw.currency, true)} ad revenue`
      : "";

  const { error } = await db.from("pot_contributions").insert({
    draw_id,
    source,
    amount: potAmount,
    note: [autoNote, note].filter(Boolean).join(" · ") || null,
  });
  if (error) return fail(error.message, 500);
  return json({ ok: true, added: potAmount });
}
