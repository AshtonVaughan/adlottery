import { describe, it, expect } from "vitest";
import { evaluateEligibility, canEnterDraw } from "@/lib/jurisdictions";
import type { Draw, Jurisdiction } from "@/lib/types";

const openJurisdiction: Jurisdiction = {
  id: "j-open",
  country_code: "US",
  region_code: "north_america",
  display_name: "United States",
  status: "open",
  min_age: 18,
  currency: "USD",
  requires_skill_question: false,
  requires_permit_above_amount: null,
  prize_cap_amount: null,
  kyc_required_before_payout: true,
  public_winner_display_mode: "partial",
  allowed_entry_methods: ["daily_free_entry", "referral_bonus", "promo_code"],
  blocked_entry_methods: [],
  terms_version: "v1",
  privacy_version: "v1",
  draw_rules_version: "v1",
  notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const restrictedJurisdiction: Jurisdiction = {
  ...openJurisdiction,
  id: "j-restricted",
  country_code: "CA",
  status: "restricted",
  requires_skill_question: true,
};

const waitlistJurisdiction: Jurisdiction = {
  ...openJurisdiction,
  id: "j-waitlist",
  country_code: "WW",
  status: "waitlist",
};

const blockedJurisdiction: Jurisdiction = {
  ...openJurisdiction,
  id: "j-blocked",
  country_code: "SA",
  status: "blocked",
};

describe("evaluateEligibility", () => {
  it("returns eligible for open jurisdiction with adult DOB", () => {
    const r = evaluateEligibility({
      jurisdiction: openJurisdiction,
      dob: "1990-01-01",
    });
    expect(r.status).toBe("eligible");
  });

  it("blocks underage users", () => {
    const r = evaluateEligibility({
      jurisdiction: openJurisdiction,
      dob: new Date(Date.now() - 17 * 365 * 86400 * 1000).toISOString().slice(0, 10),
    });
    expect(r.status).toBe("blocked");
  });

  it("returns restricted for restricted jurisdiction", () => {
    const r = evaluateEligibility({
      jurisdiction: restrictedJurisdiction,
      dob: "1990-01-01",
    });
    expect(r.status).toBe("restricted");
  });

  it("returns waitlisted for waitlist jurisdiction", () => {
    const r = evaluateEligibility({
      jurisdiction: waitlistJurisdiction,
      dob: "1990-01-01",
    });
    expect(r.status).toBe("waitlisted");
  });

  it("blocks signups for blocked jurisdiction", () => {
    const r = evaluateEligibility({
      jurisdiction: blockedJurisdiction,
      dob: "1990-01-01",
    });
    expect(r.status).toBe("blocked");
  });

  it("blocks when jurisdiction is missing", () => {
    const r = evaluateEligibility({ jurisdiction: null, dob: "1990-01-01" });
    expect(r.status).toBe("blocked");
  });
});

describe("canEnterDraw", () => {
  const draw: Pick<
    Draw,
    "status" | "starts_at" | "ends_at" | "eligible_country_codes" | "excluded_country_codes"
  > = {
    status: "active",
    starts_at: new Date(Date.now() - 1000).toISOString(),
    ends_at: new Date(Date.now() + 60_000).toISOString(),
    eligible_country_codes: ["US", "GB"],
    excluded_country_codes: [],
  };
  const profile = {
    country_code: "US",
    eligibility_status: "eligible" as const,
    banned_at: null,
  };

  it("allows eligible US user on an active US draw", () => {
    expect(
      canEnterDraw({
        draw,
        jurisdiction: openJurisdiction,
        profile,
        entrySource: "daily_free_entry",
      }).ok,
    ).toBe(true);
  });

  it("rejects when draw is locked", () => {
    const r = canEnterDraw({
      draw: { ...draw, status: "locked" },
      jurisdiction: openJurisdiction,
      profile,
      entrySource: "daily_free_entry",
    });
    expect(r.ok).toBe(false);
  });

  it("rejects banned users", () => {
    const r = canEnterDraw({
      draw,
      jurisdiction: openJurisdiction,
      profile: { ...profile, banned_at: new Date().toISOString() },
      entrySource: "daily_free_entry",
    });
    expect(r.ok).toBe(false);
  });

  it("rejects users from blocked country", () => {
    const r = canEnterDraw({
      draw: { ...draw, eligible_country_codes: ["US"], excluded_country_codes: ["US"] },
      jurisdiction: openJurisdiction,
      profile,
      entrySource: "daily_free_entry",
    });
    expect(r.ok).toBe(false);
  });

  it("rejects users from a country not in the eligible list", () => {
    const r = canEnterDraw({
      draw: { ...draw, eligible_country_codes: ["GB"] },
      jurisdiction: openJurisdiction,
      profile,
      entrySource: "daily_free_entry",
    });
    expect(r.ok).toBe(false);
  });

  it("rejects entry methods not in allowed list", () => {
    const r = canEnterDraw({
      draw,
      jurisdiction: {
        ...openJurisdiction,
        allowed_entry_methods: ["referral_bonus"],
      },
      profile,
      entrySource: "daily_free_entry",
    });
    expect(r.ok).toBe(false);
  });
});
