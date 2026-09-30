import { requireSessionApi, fail, json } from "@/lib/api";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureDrawForWeek } from "@/lib/draw";
import { entryBlock, ENTRY_BLOCK_MESSAGES } from "@/lib/eligibility";
import { getUserDrawStatus } from "@/lib/data";
import { utcDateKey } from "@/lib/week";

export async function POST() {
  const guard = await requireSessionApi();
  if (!guard.ok) return guard.response;
  const { session } = guard;

  const now = new Date();
  const draw = await ensureDrawForWeek(now);
  const block = entryBlock(session.profile, draw, now);
  if (block) return fail(ENTRY_BLOCK_MESSAGES[block], 403);

  const { error } = await getSupabaseAdminClient().from("entries").insert({
    draw_id: draw.id,
    user_id: session.userId,
    entry_date: utcDateKey(now),
  });
  if (error && error.code !== "23505") return fail("Could not record your entry. Try again.", 500);

  const status = await getUserDrawStatus(session.userId, draw.id);
  return json({ ok: true, alreadyEntered: Boolean(error), ...status });
}
