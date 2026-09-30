import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { commitmentRoundForDraw, drandRoundTime } from "@/lib/drand";
import { fetchDrandRandomness } from "@/lib/drand-server";
import { generateSecretSeed, sha256Hex, winnerIndex } from "@/lib/hash";
import { summarizePot } from "@/lib/pot";
import { weekBounds, weekLabel } from "@/lib/week";
import { APP_URL, CLAIM_WINDOW_DAYS, CURRENCY } from "@/lib/config";
import { sendEmail } from "@/lib/email";
import { formatMoney } from "@/lib/utils";
import type { Contribution, Draw } from "@/lib/types";

const PAGE_SIZE = 1000;
const DAY_MS = 86_400_000;

type Result<T = object> = ({ ok: true } & T) | { ok: false; reason: string };

/**
 * Returns this week's draw, creating it if needed. Creation generates the
 * secret seed and publishes only its hash plus a drand round that is
 * released after the draw closes.
 */
export async function ensureDrawForWeek(now: Date = new Date()): Promise<Draw> {
  const db = getSupabaseAdminClient();
  const { weekStart, opensAt, closesAt } = weekBounds(now);

  const { data: existing } = await db
    .from("draws")
    .select("*")
    .eq("week_start", weekStart)
    .maybeSingle<Draw>();
  if (existing) return existing;

  const seed = generateSecretSeed();
  const { data: created, error } = await db
    .from("draws")
    .insert({
      week_start: weekStart,
      opens_at: opensAt.toISOString(),
      closes_at: closesAt.toISOString(),
      currency: CURRENCY,
      seed_hash: sha256Hex(seed),
      randomness_round: commitmentRoundForDraw(closesAt.toISOString(), now),
    })
    .select("*")
    .single<Draw>();

  if (error) {
    // Another request created it first.
    if (error.code === "23505") {
      const { data } = await db
        .from("draws")
        .select("*")
        .eq("week_start", weekStart)
        .single<Draw>();
      if (data) return data;
    }
    throw new Error(`Could not create draw: ${error.message}`);
  }

  const { error: secretError } = await db
    .from("draw_secrets")
    .insert({ draw_id: created.id, seed });
  if (secretError) {
    await db.from("draws").delete().eq("id", created.id);
    throw new Error(`Could not store draw seed: ${secretError.message}`);
  }
  return created;
}

export async function closeDueDraws(now: Date = new Date()): Promise<number> {
  const db = getSupabaseAdminClient();
  const { data, error } = await db
    .from("draws")
    .update({ status: "closed" })
    .eq("status", "open")
    .lte("closes_at", now.toISOString())
    .select("id");
  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

/**
 * All entry ids for a draw in (created_at, id) order. Pages explicitly
 * because PostgREST caps each response, then cross-checks the count.
 */
export async function fetchDrawEntries(
  drawId: string,
): Promise<Result<{ entries: { id: string; user_id: string | null }[] }>> {
  const db = getSupabaseAdminClient();
  const entries: { id: string; user_id: string | null }[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await db
      .from("entries")
      .select("id, user_id")
      .eq("draw_id", drawId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) return { ok: false, reason: error.message };
    entries.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  const { count, error } = await db
    .from("entries")
    .select("id", { head: true, count: "exact" })
    .eq("draw_id", drawId);
  if (error) return { ok: false, reason: error.message };
  if (count !== entries.length) {
    return { ok: false, reason: `Loaded ${entries.length} of ${count} entries.` };
  }
  return { ok: true, entries };
}

async function rollover(amount: number, note: string, now: Date): Promise<void> {
  if (amount <= 0) return;
  const target = await ensureDrawForWeek(now);
  const { error } = await getSupabaseAdminClient()
    .from("pot_contributions")
    .insert({ draw_id: target.id, source: "rollover", amount, note });
  if (error) throw new Error(`Rollover failed: ${error.message}`);
}

/** Draws a closed draw once its drand round is out. Safe to call repeatedly. */
export async function runDraw(
  drawId: string,
  now: Date = new Date(),
): Promise<Result<{ status: "drawn" | "waiting" | "rolled_over" }>> {
  const db = getSupabaseAdminClient();
  const { data: draw } = await db.from("draws").select("*").eq("id", drawId).single<Draw>();
  if (!draw) return { ok: false, reason: "Draw not found." };
  if (draw.status !== "closed") return { ok: false, reason: `Draw is ${draw.status}.` };
  if (drandRoundTime(draw.randomness_round) > now) return { ok: true, status: "waiting" };

  const { data: secret } = await db
    .from("draw_secrets")
    .select("seed")
    .eq("draw_id", drawId)
    .maybeSingle<{ seed: string }>();
  if (!secret || sha256Hex(secret.seed) !== draw.seed_hash) {
    return { ok: false, reason: "Secret seed missing or does not match the published hash." };
  }

  const beacon = await fetchDrandRandomness(draw.randomness_round);
  if (!beacon.ok) return beacon;

  const loaded = await fetchDrawEntries(drawId);
  if (!loaded.ok) return loaded;
  const { entries } = loaded;

  const { data: contributions } = await db
    .from("pot_contributions")
    .select("source, amount")
    .eq("draw_id", drawId);
  const pot = summarizePot((contributions ?? []) as Contribution[]);

  const index = entries.length > 0 ? winnerIndex(secret.seed, beacon.randomness, entries.length) : null;
  const winning = index === null ? null : entries[index];

  const { data: claimed, error: updateError } = await db
    .from("draws")
    .update({
      status: "drawn",
      seed: secret.seed,
      randomness: beacon.randomness,
      total_entries: entries.length,
      winner_index: index,
      winning_entry_id: winning?.id ?? null,
      prize_amount: winning ? pot.total : 0,
      drawn_at: now.toISOString(),
    })
    .eq("id", drawId)
    .eq("status", "closed")
    .select("id");
  if (updateError) return { ok: false, reason: updateError.message };
  if (!claimed?.length) return { ok: false, reason: "Draw was already run." };

  const label = weekLabel(draw.week_start);
  if (!winning) {
    await rollover(pot.total, `Rolled over from ${label} (no entries)`, now);
    return { ok: true, status: "rolled_over" };
  }

  if (pot.total > 0) {
    const { error: winnerError } = await db.from("winners").insert({
      draw_id: drawId,
      user_id: winning.user_id,
      entry_id: winning.id,
      amount: pot.total,
      currency: draw.currency,
      claim_deadline: new Date(now.getTime() + CLAIM_WINDOW_DAYS * DAY_MS).toISOString(),
    });
    if (winnerError) return { ok: false, reason: winnerError.message };
    await notifyWinner(winning.user_id, pot.total, draw.currency, label);
  }
  return { ok: true, status: "drawn" };
}

async function notifyWinner(
  userId: string | null,
  amount: number,
  currency: string,
  label: string,
): Promise<void> {
  if (!userId) return;
  const { data: profile } = await getSupabaseAdminClient()
    .from("profiles")
    .select("email, display_name")
    .eq("id", userId)
    .single<{ email: string; display_name: string | null }>();
  if (!profile) return;
  await sendEmail({
    to: profile.email,
    subject: `You won ${formatMoney(amount, currency)} in the ${label} draw`,
    text: [
      `Hi ${profile.display_name ?? "there"},`,
      "",
      `Your entry was drawn as the winner of ${label}: ${formatMoney(amount, currency, true)}.`,
      `Claim it within ${CLAIM_WINDOW_DAYS} days at ${APP_URL}/account`,
      "",
      "Unclaimed prizes roll over into a future pot.",
    ].join("\n"),
  });
}

/** Pending prizes past their deadline are forfeited into the current pot. */
export async function forfeitExpiredPrizes(now: Date = new Date()): Promise<number> {
  const db = getSupabaseAdminClient();
  const { data: expired } = await db
    .from("winners")
    .select("draw_id, amount")
    .eq("status", "pending")
    .lt("claim_deadline", now.toISOString());

  let count = 0;
  for (const w of expired ?? []) {
    const { data: updated } = await db
      .from("winners")
      .update({ status: "forfeited" })
      .eq("draw_id", w.draw_id)
      .eq("status", "pending")
      .select("draw_id");
    if (!updated?.length) continue;
    const { data: draw } = await db
      .from("draws")
      .select("week_start")
      .eq("id", w.draw_id)
      .single<{ week_start: string }>();
    await rollover(
      Number(w.amount),
      `Unclaimed prize from ${draw ? weekLabel(draw.week_start) : "a past draw"}`,
      now,
    );
    count++;
  }
  return count;
}

export interface LifecycleReport {
  currentDrawId: string;
  closed: number;
  results: { drawId: string; outcome: string }[];
  forfeited: number;
}

/** Everything the weekly cycle needs. Idempotent; run it as often as you like. */
export async function runLifecycle(now: Date = new Date()): Promise<LifecycleReport> {
  const current = await ensureDrawForWeek(now);
  const closed = await closeDueDraws(now);

  const { data: pending } = await getSupabaseAdminClient()
    .from("draws")
    .select("id")
    .eq("status", "closed")
    .order("closes_at", { ascending: true });

  const results: LifecycleReport["results"] = [];
  for (const d of pending ?? []) {
    const r = await runDraw(d.id, now);
    results.push({ drawId: d.id, outcome: r.ok ? r.status : `error: ${r.reason}` });
  }

  const forfeited = await forfeitExpiredPrizes(now);
  return { currentDrawId: current.id, closed, results, forfeited };
}
