import { describe, it, expect } from "vitest";
import { deterministicWinnerIndex, seedHash } from "@/lib/hash";
import { pickEntryForUserId } from "@/lib/draw";

describe("deterministicWinnerIndex", () => {
  it("is deterministic for the same inputs", () => {
    const a = deterministicWinnerIndex("seed-x", "rand-y", 100);
    const b = deterministicWinnerIndex("seed-x", "rand-y", 100);
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(100);
  });

  it("changes when randomness source changes", () => {
    const a = deterministicWinnerIndex("seed", "rand-a", 1000);
    const b = deterministicWinnerIndex("seed", "rand-b", 1000);
    expect(a).not.toBe(b);
  });

  it("throws on zero entries", () => {
    expect(() => deterministicWinnerIndex("a", "b", 0)).toThrow();
  });
});

describe("seedHash", () => {
  it("produces a 64-char hex digest", () => {
    expect(seedHash("hello")).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("pickEntryForUserId", () => {
  it("returns the entry at winner_index after deterministic ordering", () => {
    const entries = [
      { id: "id-c", user_id: "u3", created_at: "2025-01-01T00:00:02Z" },
      { id: "id-a", user_id: "u1", created_at: "2025-01-01T00:00:00Z" },
      { id: "id-b", user_id: "u2", created_at: "2025-01-01T00:00:01Z" },
    ];
    const { entry, winnerIndex } = pickEntryForUserId(
      entries,
      "seed-deterministic",
      "rand-deterministic",
    );
    expect(winnerIndex).toBe(
      deterministicWinnerIndex("seed-deterministic", "rand-deterministic", 3),
    );
    const sorted = [...entries].sort((a, b) =>
      a.created_at === b.created_at ? a.id.localeCompare(b.id) : a.created_at.localeCompare(b.created_at),
    );
    expect(entry.id).toBe(sorted[winnerIndex].id);
  });
});
