import { describe, it, expect } from "vitest";

/**
 * `claim_date` is the date portion (YYYY-MM-DD) of `now()` UTC. Combined
 * with the unique(user_id, draw_id, claim_date) constraint in the
 * migration, this guarantees one daily entry per user per draw per day.
 *
 * If we ever switch to per-region local dates we must also update the
 * uniqueness check so it stays cross-day-safe.
 */
function todayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

describe("daily entry uniqueness key", () => {
  it("is the UTC date in YYYY-MM-DD", () => {
    const d = new Date("2026-01-02T03:04:05Z");
    expect(todayKey(d)).toBe("2026-01-02");
  });
  it("groups two calls within the same UTC day to the same key", () => {
    const a = new Date("2026-01-02T00:00:01Z");
    const b = new Date("2026-01-02T23:59:59Z");
    expect(todayKey(a)).toBe(todayKey(b));
  });
  it("changes across the UTC day boundary", () => {
    const a = new Date("2026-01-02T23:59:59Z");
    const b = new Date("2026-01-03T00:00:00Z");
    expect(todayKey(a)).not.toBe(todayKey(b));
  });
});
