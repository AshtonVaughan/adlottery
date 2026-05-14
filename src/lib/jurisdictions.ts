import { ageFromDob } from "@/lib/utils";
import type {
  Draw,
  EligibilityStatus,
  EntrySource,
  Jurisdiction,
} from "@/lib/types";

export interface EligibilityCheckInput {
  jurisdiction: Jurisdiction | null;
  dob: string;
}

export interface EligibilityResult {
  status: EligibilityStatus;
  reason?: string;
}

/**
 * Decide a profile's eligibility from a jurisdiction row and a DOB.
 * Pure function — easy to unit-test, never trusts the client.
 */
export function evaluateEligibility({
  jurisdiction,
  dob,
}: EligibilityCheckInput): EligibilityResult {
  if (!jurisdiction) {
    return {
      status: "blocked",
      reason: "Your country is not currently supported.",
    };
  }

  if (jurisdiction.status === "blocked") {
    return {
      status: "blocked",
      reason: "This region is not eligible at this time.",
    };
  }

  const age = ageFromDob(dob);
  if (age < jurisdiction.min_age) {
    return {
      status: "blocked",
      reason: `You must be at least ${jurisdiction.min_age} to participate.`,
    };
  }

  if (jurisdiction.status === "waitlist") {
    return {
      status: "waitlisted",
      reason: "This region is on the waitlist.",
    };
  }

  if (jurisdiction.status === "restricted") {
    return {
      status: "restricted",
      reason: "This region requires additional eligibility steps.",
    };
  }

  return { status: "eligible" };
}

export interface DrawEligibilityInput {
  draw: Pick<
    Draw,
    | "status"
    | "starts_at"
    | "ends_at"
    | "eligible_country_codes"
    | "excluded_country_codes"
  >;
  jurisdiction: Jurisdiction | null;
  profile: {
    country_code: string;
    eligibility_status: EligibilityStatus;
    banned_at: string | null;
  };
  entrySource: EntrySource;
  now?: Date;
}

export function canEnterDraw({
  draw,
  jurisdiction,
  profile,
  entrySource,
  now = new Date(),
}: DrawEligibilityInput): { ok: true } | { ok: false; reason: string } {
  if (profile.banned_at) {
    return { ok: false, reason: "Account is banned." };
  }
  if (draw.status !== "active") {
    return { ok: false, reason: "Draw is not active." };
  }
  if (new Date(draw.starts_at) > now) {
    return { ok: false, reason: "Draw has not started yet." };
  }
  if (new Date(draw.ends_at) <= now) {
    return { ok: false, reason: "Draw entry window has closed." };
  }
  if (!draw.eligible_country_codes.includes(profile.country_code)) {
    return {
      ok: false,
      reason: "Your country is not eligible for this draw.",
    };
  }
  if (draw.excluded_country_codes.includes(profile.country_code)) {
    return {
      ok: false,
      reason: "Your country is excluded from this draw.",
    };
  }
  if (!jurisdiction) {
    return { ok: false, reason: "No jurisdiction configured for your country." };
  }
  if (jurisdiction.status === "blocked") {
    return { ok: false, reason: "Your region is blocked." };
  }
  if (jurisdiction.status === "waitlist") {
    return { ok: false, reason: "Your region is on the waitlist." };
  }
  if (
    profile.eligibility_status !== "eligible" &&
    profile.eligibility_status !== "restricted"
  ) {
    return {
      ok: false,
      reason: "You are not currently eligible to participate.",
    };
  }
  if (
    !jurisdiction.allowed_entry_methods.includes(entrySource) ||
    jurisdiction.blocked_entry_methods.includes(entrySource)
  ) {
    return {
      ok: false,
      reason: "This entry method is not allowed in your region.",
    };
  }
  return { ok: true };
}
