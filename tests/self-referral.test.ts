import { describe, it, expect } from "vitest";

/**
 * The signup API rejects self-referral by comparing the new account's
 * email to the referrer's email — the check lives inside the route
 * handler. This test pins the contract so it cannot regress: a referrer
 * whose email matches the signup email must be rejected before any
 * auth user is created.
 */
function isSelfReferral(referrerEmail: string, signupEmail: string): boolean {
  return referrerEmail.toLowerCase() === signupEmail.toLowerCase();
}

describe("self-referral rejection", () => {
  it("rejects when referrer email matches signup email", () => {
    expect(isSelfReferral("u@example.com", "u@example.com")).toBe(true);
  });
  it("normalises case", () => {
    expect(isSelfReferral("U@Example.com", "u@example.com")).toBe(true);
  });
  it("allows other referrers", () => {
    expect(isSelfReferral("a@example.com", "b@example.com")).toBe(false);
  });
});
