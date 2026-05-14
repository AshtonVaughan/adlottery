import { describe, it, expect } from "vitest";
import { signupSchema, createDrawSchema } from "@/lib/validation";

describe("signupSchema", () => {
  const base = {
    email: "u@example.com",
    password: "longenoughpassword1!",
    dob: "1990-01-01",
    country_code: "US",
    accept_terms: true,
    accept_privacy: true,
    accept_draw_rules: true,
  };
  it("accepts a valid payload", () => {
    expect(signupSchema.safeParse(base).success).toBe(true);
  });
  it("rejects short passwords", () => {
    const bad = { ...base, password: "short" };
    expect(signupSchema.safeParse(bad).success).toBe(false);
  });
  it("rejects malformed DOB", () => {
    const bad = { ...base, dob: "01/01/1990" };
    expect(signupSchema.safeParse(bad).success).toBe(false);
  });
  it("rejects unsupported country", () => {
    const bad = { ...base, country_code: "ZZ" };
    expect(signupSchema.safeParse(bad).success).toBe(false);
  });
  it("requires the three acceptance booleans", () => {
    const bad = { ...base, accept_terms: false };
    expect(signupSchema.safeParse(bad).success).toBe(false);
  });
});

describe("createDrawSchema", () => {
  it("validates a reasonable draw", () => {
    const r = createDrawSchema.safeParse({
      title: "Weekly Free Prize Draw",
      draw_type: "weekly_draw",
      prize_amount: 500,
      currency: "USD",
      eligible_country_codes: ["US", "GB"],
      excluded_country_codes: [],
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 86_400_000).toISOString(),
    });
    expect(r.success).toBe(true);
  });
  it("requires at least one eligible country", () => {
    const r = createDrawSchema.safeParse({
      title: "X",
      draw_type: "weekly_draw",
      prize_amount: 1,
      currency: "USD",
      eligible_country_codes: [],
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 86_400_000).toISOString(),
    });
    expect(r.success).toBe(false);
  });
});
