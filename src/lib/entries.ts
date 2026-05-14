import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { canEnterDraw } from "@/lib/jurisdictions";
import { hashIp, hashDevice } from "@/lib/hash";
import { writeAuditLog } from "@/lib/audit";
import type { Draw, EntrySource, Jurisdiction, Profile } from "@/lib/types";

export interface ClaimDailyEntryParams {
  userId: string;
  drawId: string;
  ip?: string | null;
  userAgent?: string | null;
}

export interface ClaimDailyEntryResult {
  ok: boolean;
  reason?: string;
  entryId?: string;
  referralRewarded?: boolean;
  totalUserEntries?: number;
}

export async function claimDailyEntry(
  params: ClaimDailyEntryParams,
): Promise<ClaimDailyEntryResult> {
  const admin = getSupabaseAdminClient();

  const [{ data: profile }, { data: draw }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", params.userId).single<Profile>(),
    admin.from("draws").select("*").eq("id", params.drawId).single<Draw>(),
  ]);

  if (!profile) return { ok: false, reason: "Profile not found." };
  if (!draw) return { ok: false, reason: "Draw not found." };

  const { data: jurisdiction } = await admin
    .from("jurisdictions")
    .select("*")
    .eq("country_code", profile.country_code)
    .single<Jurisdiction>();

  const eligibility = canEnterDraw({
    draw,
    jurisdiction,
    profile,
    entrySource: "daily_free_entry",
  });
  if (!eligibility.ok) {
    return { ok: false, reason: eligibility.reason };
  }

  const today = new Date().toISOString().slice(0, 10);

  // Uniqueness check: if a row already exists for (user, draw, date), bail.
  const { data: existing } = await admin
    .from("daily_entry_claims")
    .select("id")
    .eq("user_id", params.userId)
    .eq("draw_id", params.drawId)
    .eq("claim_date", today)
    .maybeSingle();
  if (existing) {
    return { ok: false, reason: "Daily free entry already claimed today." };
  }

  const ip_hash = hashIp(params.ip ?? null);
  const device_hash = hashDevice(params.userAgent ?? null);

  const { data: entry, error: entryErr } = await admin
    .from("entries")
    .insert({
      user_id: params.userId,
      draw_id: params.drawId,
      source: "daily_free_entry",
      ip_hash,
      device_hash,
      country_code: profile.country_code,
      region_code: profile.region_code,
    })
    .select("id")
    .single();

  if (entryErr || !entry) {
    return { ok: false, reason: entryErr?.message ?? "Failed to create entry." };
  }

  const { error: claimErr } = await admin
    .from("daily_entry_claims")
    .insert({
      user_id: params.userId,
      draw_id: params.drawId,
      claim_date: today,
      entry_id: entry.id,
    });

  if (claimErr) {
    // Unique constraint protects against double-claim races.
    await admin.from("entries").delete().eq("id", entry.id);
    return { ok: false, reason: "Daily free entry already claimed today." };
  }

  // Fraud heuristic: count distinct accounts sharing this device today.
  if (device_hash) {
    const { count } = await admin
      .from("entries")
      .select("user_id", { head: true, count: "exact" })
      .eq("device_hash", device_hash)
      .gte("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString());
    if ((count ?? 0) > 4) {
      await admin.from("fraud_flags").insert({
        user_id: params.userId,
        entry_id: entry.id,
        reason: "device_hash shared across multiple accounts in 24h",
        severity: "medium",
        status: "open",
        metadata: { device_hash, count },
      });
    }
  }

  let referralRewarded = false;
  if (profile.referred_by) {
    const { data: referral } = await admin
      .from("referrals")
      .select("id, status")
      .eq("referrer_user_id", profile.referred_by)
      .eq("referred_user_id", profile.id)
      .maybeSingle();

    if (referral?.status === "pending") {
      const { data: referrer } = await admin
        .from("profiles")
        .select("id, country_code, eligibility_status, banned_at, region_code")
        .eq("id", profile.referred_by)
        .single<
          Pick<
            Profile,
            "id" | "country_code" | "eligibility_status" | "banned_at" | "region_code"
          >
        >();

      const { data: referrerJurisdiction } = referrer
        ? await admin
            .from("jurisdictions")
            .select("*")
            .eq("country_code", referrer.country_code)
            .single<Jurisdiction>()
        : { data: null };

      const referralAllowed: EntrySource = "referral_bonus";
      const referrerCheck = referrer
        ? canEnterDraw({
            draw,
            jurisdiction: referrerJurisdiction,
            profile: referrer,
            entrySource: referralAllowed,
          })
        : { ok: false as const, reason: "missing referrer" };

      if (referrerCheck.ok) {
        await admin.from("entries").insert({
          user_id: referrer!.id,
          draw_id: draw.id,
          source: "referral_bonus",
          source_ref: profile.id,
          country_code: referrer!.country_code,
          region_code: referrer!.region_code,
        });
      }

      await admin
        .from("referrals")
        .update({
          status: "rewarded",
          draw_id: draw.id,
          rewarded_at: new Date().toISOString(),
        })
        .eq("id", referral.id);

      referralRewarded = true;
    }
  }

  const { count: totalUserEntries } = await admin
    .from("entries")
    .select("id", { head: true, count: "exact" })
    .eq("draw_id", draw.id)
    .eq("user_id", params.userId);

  await writeAuditLog({
    actorUserId: params.userId,
    action: "entry.claim_daily",
    entityType: "entry",
    entityId: entry.id,
    metadata: {
      draw_id: draw.id,
      referral_rewarded: referralRewarded,
    },
  });

  return {
    ok: true,
    entryId: entry.id,
    referralRewarded,
    totalUserEntries: totalUserEntries ?? 0,
  };
}
