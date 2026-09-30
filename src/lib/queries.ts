"use client";

import { supabase } from "@/lib/supabase";
import { demoContributions, demoCurrent, demoLast } from "@/lib/demo";
import type { AdminOverview, Contribution, DrawView, EntryBlock, MyStatus } from "@/lib/types";

export const ENTRY_BLOCK_MESSAGES: Record<EntryBlock, string> = {
  needs_profile: "Finish your profile to enter.",
  banned: "This account can't enter draws. Contact support if you think this is a mistake.",
  excluded_country: "Sorry, the draw isn't open to residents of your country.",
  draw_closed: "This week's draw has closed. The next one opens Monday 00:00 UTC.",
};

function friendly(message: string): string {
  return ENTRY_BLOCK_MESSAGES[message as EntryBlock] ?? message;
}

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const db = supabase();
  if (!db) throw new Error("Demo mode: connect Supabase to enable this.");
  const { data, error } = await db.rpc(fn, args);
  if (error) throw new Error(friendly(error.message));
  return data as T;
}

// Numbers come back from Postgres numeric as JSON numbers already.
export async function getHome(): Promise<{ current: DrawView | null; last: DrawView | null }> {
  if (!supabase()) return { current: demoCurrent(), last: demoLast() };
  return rpc("home_data");
}

export async function getDraw(id: string): Promise<DrawView | null> {
  if (!supabase()) return [demoCurrent(), demoLast()].find((v) => v.draw.id === id) ?? null;
  return rpc("draw_view", { p_draw_id: id });
}

export async function getPastDraws(): Promise<DrawView[]> {
  if (!supabase()) return [demoLast()];
  return rpc("past_draws", { p_limit: 52 });
}

export async function getContributions(view: DrawView): Promise<Contribution[]> {
  const db = supabase();
  if (!db) return demoContributions(view);
  const { data, error } = await db
    .from("pot_contributions")
    .select("id, source, amount, note")
    .eq("draw_id", view.draw.id)
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []).map((c) => ({ ...c, amount: Number(c.amount) })) as Contribution[];
}

export async function getEntryIds(drawId: string): Promise<string[] | null> {
  if (!supabase()) return null;
  return rpc("draw_entry_ids", { p_draw_id: drawId });
}

export async function getMyEntryIds(drawId: string): Promise<string[]> {
  if (!supabase()) return [];
  return rpc("my_entry_ids", { p_draw_id: drawId });
}

export const getMyStatus = () => rpc<MyStatus | null>("my_status");
export const enterDraw = () => rpc<{ entered: boolean; entries: number }>("enter_draw");

export const saveProfile = (name: string, country: string, adult: boolean, rules: boolean) =>
  rpc<void>("save_profile", {
    p_display_name: name,
    p_country_code: country,
    p_confirm_adult: adult,
    p_accept_rules: rules,
  });

export const claimPrize = (drawId: string, legalName: string, payout: string) =>
  rpc<void>("claim_prize", { p_draw_id: drawId, p_legal_name: legalName, p_payout_details: payout });

export const adminOverview = () => rpc<AdminOverview>("admin_overview");
export const adminAddContribution = (source: "sponsor" | "ads", amount: number, note: string) =>
  rpc<number>("admin_add_contribution", { p_source: source, p_amount: amount, p_note: note });
export const adminSetSponsor = (name: string, url: string, tagline: string) =>
  rpc<void>("admin_set_sponsor", { p_name: name, p_url: url, p_tagline: tagline });
export const adminUpdateWinner = (drawId: string, status: "verified" | "paid" | "forfeited", reference = "") =>
  rpc<void>("admin_update_winner", { p_draw_id: drawId, p_status: status, p_reference: reference });
export const adminSetBan = (email: string, banned: boolean) =>
  rpc<void>("admin_set_ban", { p_email: email, p_banned: banned });
