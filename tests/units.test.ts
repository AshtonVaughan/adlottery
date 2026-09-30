import { describe, it, expect, vi, afterEach } from "vitest";
import { createHash } from "node:crypto";
import { weekBounds, weekStartUtc, isoWeekNumber, utcDateKey } from "@/lib/week";
import { summarizePot, adsContribution } from "@/lib/pot";
import { winnerIndex, generateSecretSeed } from "@/lib/hash";
import { entryBlock } from "@/lib/eligibility";
import { RULES_VERSION } from "@/lib/config";
import { drandRoundAt, drandRoundTime, commitmentRoundForDraw, DRAND_GENESIS_SECONDS } from "@/lib/drand";
import { fetchDrandRandomness } from "@/lib/drand-server";

describe("week math", () => {
  it("starts weeks on Monday 00:00 UTC", () => {
    expect(utcDateKey(weekStartUtc(new Date("2026-09-30T15:00:00Z")))).toBe("2026-09-28"); // Wed
    expect(utcDateKey(weekStartUtc(new Date("2026-10-04T23:59:59Z")))).toBe("2026-09-28"); // Sun
    expect(utcDateKey(weekStartUtc(new Date("2026-09-28T00:00:00Z")))).toBe("2026-09-28"); // Mon
  });
  it("closes exactly seven days later", () => {
    const { opensAt, closesAt } = weekBounds(new Date("2026-09-30T15:00:00Z"));
    expect(closesAt.getTime() - opensAt.getTime()).toBe(7 * 86_400_000);
  });
  it("numbers ISO weeks", () => {
    expect(isoWeekNumber(new Date("2026-09-28T00:00:00Z"))).toBe(40);
    expect(isoWeekNumber(new Date("2024-12-30T00:00:00Z"))).toBe(1);
    expect(isoWeekNumber(new Date("2021-01-03T00:00:00Z"))).toBe(53);
  });
});

describe("pot", () => {
  it("sums by source without float drift", () => {
    const pot = summarizePot([
      { source: "sponsor", amount: 0.1 },
      { source: "ads", amount: 0.2 },
      { source: "rollover", amount: 100 },
    ]);
    expect(pot).toEqual({ sponsor: 0.1, ads: 0.2, rollover: 100, total: 100.3 });
  });
  it("takes the published share of ad revenue, rounding down", () => {
    expect(adsContribution(624.8, 50)).toBe(312.4);
    expect(adsContribution(0.03, 50)).toBe(0.01);
  });
});

describe("winnerIndex", () => {
  it("matches the formula published on the draw page", () => {
    const seed = generateSecretSeed();
    const random = "ab".repeat(32);
    const h = createHash("sha256").update(seed + "|" + random).digest("hex");
    expect(winnerIndex(seed, random, 12345)).toBe(Number(BigInt("0x" + h.slice(0, 13)) % 12345n));
  });
  it("stays in range and rejects empty draws", () => {
    for (let n = 1; n < 50; n++) {
      const i = winnerIndex(`s${n}`, "r", n);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(n);
    }
    expect(() => winnerIndex("s", "r", 0)).toThrow();
  });
});

describe("entryBlock", () => {
  const profile = {
    display_name: "Sam",
    country_code: "AU",
    confirmed_adult_at: "2026-01-01T00:00:00Z",
    accepted_rules_version: RULES_VERSION,
    banned_at: null,
  };
  const draw = { status: "open" as const, opens_at: "2026-09-28T00:00:00Z", closes_at: "2026-10-05T00:00:00Z" };
  const now = new Date("2026-09-30T12:00:00Z");

  it("allows a complete profile in an open draw", () => {
    expect(entryBlock(profile, draw, now, ["KP"])).toBeNull();
  });
  it("blocks each failure case", () => {
    expect(entryBlock({ ...profile, banned_at: "x" }, draw, now, [])).toBe("banned");
    expect(entryBlock({ ...profile, display_name: null }, draw, now, [])).toBe("needs_profile");
    expect(entryBlock({ ...profile, accepted_rules_version: "old" }, draw, now, [])).toBe("needs_profile");
    expect(entryBlock({ ...profile, country_code: "KP" }, draw, now, ["KP"])).toBe("excluded_country");
    expect(entryBlock(profile, null, now, [])).toBe("no_draw");
    expect(entryBlock(profile, draw, new Date("2026-10-05T00:00:00Z"), [])).toBe("draw_closed");
    expect(entryBlock(profile, { ...draw, status: "closed" }, now, [])).toBe("draw_closed");
  });
});

describe("drand", () => {
  afterEach(() => vi.unstubAllGlobals());
  const signature = "ab".repeat(48);
  const randomness = createHash("sha256").update(Buffer.from(signature, "hex")).digest("hex");

  it("maps times to rounds", () => {
    expect(drandRoundAt(new Date(DRAND_GENESIS_SECONDS * 1000))).toBe(1);
    const t = new Date("2026-01-01T00:00:01Z");
    const r = drandRoundAt(t);
    expect(drandRoundTime(r).getTime()).toBeGreaterThanOrEqual(t.getTime());
    expect(drandRoundTime(r - 1).getTime()).toBeLessThan(t.getTime());
  });
  it("commits to a round after the close", () => {
    const r = commitmentRoundForDraw("2030-01-07T00:00:00Z", new Date("2030-01-01T00:00:00Z"));
    expect(drandRoundTime(r).getTime()).toBeGreaterThan(Date.parse("2030-01-07T00:00:00Z"));
  });
  it("refuses unreleased rounds", async () => {
    expect((await fetchDrandRandomness(drandRoundAt(new Date(Date.now() + 3.6e6)))).ok).toBe(false);
  });
  it("accepts randomness = sha256(signature) and rejects anything else", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ round: 5, randomness, signature }) }));
    expect(await fetchDrandRandomness(5)).toEqual({ ok: true, randomness });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ round: 5, randomness: "00".repeat(32), signature }) }));
    expect((await fetchDrandRandomness(5)).ok).toBe(false);
  });
});
