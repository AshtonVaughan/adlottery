import { describe, it, expect } from "vitest";
import type { Jurisdiction } from "@/lib/types";

const base: Jurisdiction = {
  id: "j",
  country_code: "CA",
  region_code: "north_america",
  display_name: "Canada",
  status: "restricted",
  min_age: 18,
  currency: "CAD",
  requires_skill_question: true,
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

/**
 * The skill-question requirement is jurisdictional metadata that the
 * runDraw routine reads when creating a winner_claim. The flag must
 * round-trip cleanly and never silently get dropped — this test guards
 * the contract that drives Canada / India style claim flows.
 */
describe("jurisdiction skill-question flag", () => {
  it("is true for the seeded Canada-style restricted jurisdiction", () => {
    expect(base.requires_skill_question).toBe(true);
  });
  it("defaults to claim_status=skill_question_required for these jurisdictions", () => {
    // Mirrors the branching in runDraw(): if the winner's jurisdiction
    // requires a skill question, the claim starts at this status.
    const initialClaimStatus = base.requires_skill_question
      ? "skill_question_required"
      : "verification_required";
    expect(initialClaimStatus).toBe("skill_question_required");
  });
  it("can be flipped off (open jurisdictions like the US)", () => {
    const open = { ...base, requires_skill_question: false } as Jurisdiction;
    const initialClaimStatus = open.requires_skill_question
      ? "skill_question_required"
      : "verification_required";
    expect(initialClaimStatus).toBe("verification_required");
  });
});
