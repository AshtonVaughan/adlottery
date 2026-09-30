import { describe, it, expect, vi, afterEach } from "vitest";
import { createHash } from "node:crypto";
import { weekBounds, weekStartUtc, isoWeekNumber, utcDateKey, weekLabel } from "@/lib/week";
import { winnerIndex, generateSecretSeed } from "@/lib/hash";
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
  it("labels weeks with the ISO year", () => {
    expect(weekLabel("2024-12-30")).toBe("Week 1, 2025");
    expect(weekLabel("2026-09-28")).toBe("Week 40, 2026");
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
