import { deterministicWinnerIndex, seedHash } from "@/lib/hash";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import type { Draw, Entry, Jurisdiction } from "@/lib/types";

interface RunDrawParams {
  drawId: string;
  publicSeed: string;
  randomnessSource: string;
  actorUserId: string;
}

export async function runDraw(
  params: RunDrawParams,
): Promise<{ ok: true; winningEntryId: string } | { ok: false; reason: string }> {
  const admin = getSupabaseAdminClient();
  const { data: draw, error: drawError } = await admin
    .from("draws")
    .select("*")
    .eq("id", params.drawId)
    .single();

  if (drawError || !draw) {
    return { ok: false, reason: "Draw not found." };
  }
  if (draw.status !== "locked") {
    return { ok: false, reason: "Draw must be locked before running." };
  }

  const { data: entries, error: entriesError } = await admin
    .from("entries")
    .select("id, user_id, draw_id, created_at")
    .eq("draw_id", params.drawId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (entriesError) {
    return { ok: false, reason: entriesError.message };
  }
  if (!entries || entries.length === 0) {
    return { ok: false, reason: "Draw has no entries." };
  }

  const winnerIndex = deterministicWinnerIndex(
    params.publicSeed,
    params.randomnessSource,
    entries.length,
  );
  const winningEntry = entries[winnerIndex];

  const { error: updateError } = await admin
    .from("draws")
    .update({
      status: "drawn",
      public_seed: params.publicSeed,
      public_seed_hash: seedHash(params.publicSeed),
      randomness_source: params.randomnessSource,
      winning_entry_id: winningEntry.id,
      published_at: new Date().toISOString(),
    })
    .eq("id", params.drawId);

  if (updateError) {
    return { ok: false, reason: updateError.message };
  }

  // Determine claim status based on winner's jurisdiction.
  const { data: profile } = await admin
    .from("profiles")
    .select("country_code")
    .eq("id", winningEntry.user_id)
    .single();

  let claimStatus: "verification_required" | "skill_question_required" =
    "verification_required";
  let requiresSkillQuestion = false;

  if (profile?.country_code) {
    const { data: jurisdiction } = await admin
      .from("jurisdictions")
      .select("requires_skill_question")
      .eq("country_code", profile.country_code)
      .single<Pick<Jurisdiction, "requires_skill_question">>();

    if (jurisdiction?.requires_skill_question) {
      claimStatus = "skill_question_required";
      requiresSkillQuestion = true;
    }
  }

  const { error: claimErr } = await admin.from("winner_claims").insert({
    draw_id: params.drawId,
    user_id: winningEntry.user_id,
    winning_entry_id: winningEntry.id,
    claim_status: claimStatus,
    skill_question_required: requiresSkillQuestion,
    skill_question_answered: false,
    payout_status: "not_started",
  });
  if (claimErr) {
    return { ok: false, reason: claimErr.message };
  }

  await writeAuditLog({
    actorUserId: params.actorUserId,
    action: "draw.run",
    entityType: "draw",
    entityId: params.drawId,
    metadata: {
      public_seed_hash: seedHash(params.publicSeed),
      randomness_source: params.randomnessSource,
      total_entries: entries.length,
      winner_index: winnerIndex,
    },
  });

  return { ok: true, winningEntryId: winningEntry.id };
}

export interface DrawSummary {
  draw: Draw;
  totalEntries: number;
  userEntries: number;
}

export async function loadDrawSummary(
  drawId: string,
  userId: string | null,
): Promise<DrawSummary | null> {
  const admin = getSupabaseAdminClient();
  const { data: draw } = await admin
    .from("draws")
    .select("*")
    .eq("id", drawId)
    .single<Draw>();
  if (!draw) return null;

  const { count: totalEntries } = await admin
    .from("entries")
    .select("id", { head: true, count: "exact" })
    .eq("draw_id", drawId);

  let userEntries = 0;
  if (userId) {
    const { count } = await admin
      .from("entries")
      .select("id", { head: true, count: "exact" })
      .eq("draw_id", drawId)
      .eq("user_id", userId);
    userEntries = count ?? 0;
  }

  return {
    draw,
    totalEntries: totalEntries ?? 0,
    userEntries,
  };
}

export function pickEntryForUserId(
  entries: Pick<Entry, "id" | "user_id" | "created_at">[],
  publicSeed: string,
  randomnessSource: string,
): { entry: (typeof entries)[number]; winnerIndex: number } {
  const sorted = [...entries].sort((a, b) => {
    if (a.created_at === b.created_at) return a.id < b.id ? -1 : 1;
    return a.created_at < b.created_at ? -1 : 1;
  });
  const winnerIndex = deterministicWinnerIndex(
    publicSeed,
    randomnessSource,
    sorted.length,
  );
  return { entry: sorted[winnerIndex], winnerIndex };
}
