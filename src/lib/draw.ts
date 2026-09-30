import { deterministicWinnerIndex, generateSecretSeed, seedHash } from "@/lib/hash";
import { commitmentRoundForDraw } from "@/lib/drand";
import { fetchDrandRandomness } from "@/lib/drand-server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import type { Draw, Entry, Jurisdiction } from "@/lib/types";

const ENTRY_PAGE_SIZE = 1000;

type DrawEntryRow = Pick<Entry, "id" | "user_id" | "draw_id" | "created_at">;

/**
 * Loads every entry for a draw in (created_at, id) order. PostgREST caps
 * a single response (1000 rows by default), so we page explicitly.
 */
export async function fetchAllDrawEntries(
  drawId: string,
): Promise<{ ok: true; entries: DrawEntryRow[] } | { ok: false; reason: string }> {
  const admin = getSupabaseAdminClient();
  const entries: DrawEntryRow[] = [];
  for (let from = 0; ; from += ENTRY_PAGE_SIZE) {
    const { data, error } = await admin
      .from("entries")
      .select("id, user_id, draw_id, created_at")
      .eq("draw_id", drawId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + ENTRY_PAGE_SIZE - 1);
    if (error) return { ok: false, reason: error.message };
    entries.push(...(data ?? []));
    if (!data || data.length < ENTRY_PAGE_SIZE) break;
  }

  const { count, error: countError } = await admin
    .from("entries")
    .select("id", { head: true, count: "exact" })
    .eq("draw_id", drawId);
  if (countError) return { ok: false, reason: countError.message };
  if (count !== entries.length) {
    return {
      ok: false,
      reason: `Loaded ${entries.length} entries but the draw has ${count}. Try again.`,
    };
  }
  return { ok: true, entries };
}

/**
 * Commits the draw to a secret seed (only its hash is published) and a
 * future drand round released after entries close. Idempotent: an
 * existing commitment is never replaced.
 */
export async function commitDrawRandomness(
  draw: Pick<Draw, "id" | "ends_at" | "public_seed_hash" | "randomness_round">,
): Promise<{ ok: true; committed: boolean } | { ok: false; reason: string }> {
  if (draw.public_seed_hash && draw.randomness_round) {
    return { ok: true, committed: false };
  }
  const admin = getSupabaseAdminClient();
  const seed = generateSecretSeed();

  const { error: secretError } = await admin
    .from("draw_seed_secrets")
    .insert({ draw_id: draw.id, seed });
  if (secretError) return { ok: false, reason: secretError.message };

  const { error } = await admin
    .from("draws")
    .update({
      public_seed_hash: seedHash(seed),
      randomness_round: commitmentRoundForDraw(draw.ends_at),
      seed_committed_at: new Date().toISOString(),
    })
    .eq("id", draw.id);
  if (error) {
    await admin.from("draw_seed_secrets").delete().eq("draw_id", draw.id);
    return { ok: false, reason: error.message };
  }
  return { ok: true, committed: true };
}

interface RunDrawParams {
  drawId: string;
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
    .single<Draw>();

  if (drawError || !draw) {
    return { ok: false, reason: "Draw not found." };
  }
  if (draw.status !== "locked") {
    return { ok: false, reason: "Draw must be locked before running." };
  }
  if (!draw.public_seed_hash || !draw.randomness_round) {
    return { ok: false, reason: "Draw has no fairness commitment." };
  }

  const { data: secret } = await admin
    .from("draw_seed_secrets")
    .select("seed")
    .eq("draw_id", draw.id)
    .maybeSingle<{ seed: string }>();
  if (!secret || seedHash(secret.seed) !== draw.public_seed_hash) {
    return { ok: false, reason: "Committed seed is missing or does not match its hash." };
  }

  const beacon = await fetchDrandRandomness(draw.randomness_round);
  if (!beacon.ok) return beacon;

  const loaded = await fetchAllDrawEntries(params.drawId);
  if (!loaded.ok) return loaded;
  const entries = loaded.entries;
  if (entries.length === 0) {
    return { ok: false, reason: "Draw has no entries." };
  }

  const winnerIndex = deterministicWinnerIndex(
    secret.seed,
    beacon.randomness,
    entries.length,
  );
  const winningEntry = entries[winnerIndex];

  const { data: updated, error: updateError } = await admin
    .from("draws")
    .update({
      status: "drawn",
      public_seed: secret.seed,
      randomness_source: beacon.randomness,
      winning_entry_id: winningEntry.id,
      published_at: new Date().toISOString(),
    })
    .eq("id", params.drawId)
    .eq("status", "locked")
    .select("id");

  if (updateError) {
    return { ok: false, reason: updateError.message };
  }
  if (!updated || updated.length === 0) {
    return { ok: false, reason: "Draw was already run." };
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
      public_seed_hash: draw.public_seed_hash,
      randomness_round: draw.randomness_round,
      randomness_source: beacon.randomness,
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
