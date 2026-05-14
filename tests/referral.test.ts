import { describe, it, expect } from "vitest";
import {
  generateReferralCode,
  isPlausibleReferralCode,
} from "@/lib/referral";

describe("generateReferralCode", () => {
  it("returns a code of the requested length", () => {
    expect(generateReferralCode(8)).toHaveLength(8);
    expect(generateReferralCode(12)).toHaveLength(12);
  });

  it("uses only the allowed alphabet", () => {
    const code = generateReferralCode(32);
    expect(code).toMatch(/^[A-Z0-9]+$/);
    expect(code).not.toMatch(/[01OI]/);
  });
});

describe("isPlausibleReferralCode", () => {
  it("accepts simple alphanumeric codes", () => {
    expect(isPlausibleReferralCode("ABC123")).toBe(true);
    expect(isPlausibleReferralCode("AB-CD-EF")).toBe(true);
  });

  it("rejects too-short or invalid codes", () => {
    expect(isPlausibleReferralCode("AB")).toBe(false);
    expect(isPlausibleReferralCode("ABCD$$")).toBe(false);
    expect(isPlausibleReferralCode("")).toBe(false);
  });
});
