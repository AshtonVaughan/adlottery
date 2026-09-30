import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHash } from "node:crypto";
import {
  DRAND_GENESIS_SECONDS,
  DRAND_PERIOD_SECONDS,
  DRAND_ROUND_DELAY_SECONDS,
  commitmentRoundForDraw,
  drandRoundAt,
  drandRoundTime,
} from "@/lib/drand";
import { fetchDrandRandomness } from "@/lib/drand-server";
import { generateSecretSeed, seedHash } from "@/lib/hash";

// In-memory stand-in for the Supabase entries table that enforces the
// same 1000-row response cap PostgREST applies by default.
const ROW_CAP = 1000;
let fakeEntries: { id: string; user_id: string; draw_id: string; created_at: string }[] = [];

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => ({
    from: () => {
      const q = {
        head: false,
        range: [0, Infinity] as [number, number],
        select(_cols: string, opts?: { head?: boolean }) {
          q.head = Boolean(opts?.head);
          return q;
        },
        eq() {
          if (q.head) return Promise.resolve({ count: fakeEntries.length, error: null });
          return q;
        },
        order() {
          return q;
        },
        rangeFn(from: number, to: number) {
          const slice = fakeEntries.slice(from, Math.min(to + 1, from + ROW_CAP));
          return Promise.resolve({ data: slice, error: null });
        },
      };
      return Object.assign(q, { range: q.rangeFn });
    },
  }),
}));

describe("drand round math", () => {
  it("round 1 is at genesis", () => {
    expect(drandRoundTime(1).getTime()).toBe(DRAND_GENESIS_SECONDS * 1000);
    expect(drandRoundAt(new Date(DRAND_GENESIS_SECONDS * 1000))).toBe(1);
  });

  it("returns the first round at or after a time", () => {
    const t = new Date((DRAND_GENESIS_SECONDS + 10 * DRAND_PERIOD_SECONDS + 1) * 1000);
    const round = drandRoundAt(t);
    expect(drandRoundTime(round).getTime()).toBeGreaterThanOrEqual(t.getTime());
    expect(drandRoundTime(round - 1).getTime()).toBeLessThan(t.getTime());
  });

  it("commits to a round strictly after entries close", () => {
    const endsAt = "2030-01-01T00:00:00Z";
    const round = commitmentRoundForDraw(endsAt, new Date("2029-12-01T00:00:00Z"));
    expect(drandRoundTime(round).getTime()).toBeGreaterThanOrEqual(
      new Date(endsAt).getTime() + DRAND_ROUND_DELAY_SECONDS * 1000,
    );
  });

  it("uses now when the draw already ended (late commitment on lock)", () => {
    const now = new Date("2030-02-01T00:00:00Z");
    const round = commitmentRoundForDraw("2030-01-01T00:00:00Z", now);
    expect(drandRoundTime(round).getTime()).toBeGreaterThan(now.getTime());
  });
});

describe("secret seed", () => {
  it("is 32 random bytes and hashes to its commitment", () => {
    const a = generateSecretSeed();
    const b = generateSecretSeed();
    expect(a).toMatch(/^[a-f0-9]{64}$/);
    expect(a).not.toBe(b);
    expect(seedHash(a)).toBe(createHash("sha256").update(a).digest("hex"));
  });
});

describe("fetchDrandRandomness", () => {
  const signature = "ab".repeat(48);
  const randomness = createHash("sha256").update(Buffer.from(signature, "hex")).digest("hex");

  afterEach(() => vi.unstubAllGlobals());

  it("refuses rounds that are not released yet", async () => {
    const future = drandRoundAt(new Date(Date.now() + 3_600_000));
    const res = await fetchDrandRandomness(future);
    expect(res.ok).toBe(false);
  });

  it("accepts a round whose randomness is sha256(signature)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ round: 5, randomness, signature }) }),
    );
    expect(await fetchDrandRandomness(5)).toEqual({ ok: true, randomness });
  });

  it("rejects a relay returning mismatched randomness", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ round: 5, randomness: "00".repeat(32), signature }),
      }),
    );
    expect((await fetchDrandRandomness(5)).ok).toBe(false);
  });
});

describe("fetchAllDrawEntries", () => {
  beforeEach(() => {
    fakeEntries = Array.from({ length: 2500 }, (_, i) => ({
      id: `e-${String(i).padStart(5, "0")}`,
      user_id: `u-${i}`,
      draw_id: "d1",
      created_at: new Date(1_700_000_000_000 + i * 1000).toISOString(),
    }));
  });

  it("pages past the 1000-row response cap", async () => {
    const { fetchAllDrawEntries } = await import("@/lib/draw");
    const res = await fetchAllDrawEntries("d1");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.entries).toHaveLength(2500);
      expect(res.entries[2499].id).toBe("e-02499");
    }
  });

  it("handles an exact multiple of the page size", async () => {
    fakeEntries = fakeEntries.slice(0, 2000);
    const { fetchAllDrawEntries } = await import("@/lib/draw");
    const res = await fetchAllDrawEntries("d1");
    expect(res.ok && res.entries.length).toBe(2000);
  });
});
