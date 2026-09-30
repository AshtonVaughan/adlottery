import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHash } from "node:crypto";
import { FakeDb } from "./fake-supabase";

let db: FakeDb;
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdminClient: () => db }));

import { ensureDrawForWeek, runLifecycle, fetchDrawEntries } from "@/lib/draw";
import { drandRoundTime } from "@/lib/drand";
import { winnerIndex } from "@/lib/hash";
import type { Draw } from "@/lib/types";

const sha = (s: string | Buffer) => createHash("sha256").update(s).digest("hex");
const SIGNATURE = "cd".repeat(48);
const RANDOMNESS = sha(Buffer.from(SIGNATURE, "hex"));

// A Wednesday in a past week, so every drand round involved is "released".
const WED = new Date("2025-03-05T12:00:00Z");
const NEXT_MON = new Date("2025-03-10T00:05:00Z");

function stubDrand() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const round = Number(url.split("/").pop());
      return { ok: true, json: async () => ({ round, randomness: RANDOMNESS, signature: SIGNATURE }) };
    }),
  );
}

function addEntries(drawId: string, n: number) {
  for (let i = 0; i < n; i++) {
    db.rows("entries").push({
      id: `entry-${String(i).padStart(5, "0")}`,
      draw_id: drawId,
      user_id: `user-${i}`,
      entry_date: "2025-03-05",
      created_at: new Date(Date.parse("2025-03-05T00:00:00Z") + i * 1000).toISOString(),
    });
  }
}

function draw(id: string): Draw {
  return db.rows("draws").find((d) => d.id === id) as unknown as Draw;
}

beforeEach(() => {
  db = new FakeDb();
  stubDrand();
});
afterEach(() => vi.unstubAllGlobals());

describe("ensureDrawForWeek", () => {
  it("creates one draw per week with a hidden seed and a post-close drand round", async () => {
    const a = await ensureDrawForWeek(WED);
    const b = await ensureDrawForWeek(new Date("2025-03-09T23:59:59Z"));
    expect(b.id).toBe(a.id);
    expect(a.week_start).toBe("2025-03-03");
    expect(a.closes_at).toBe("2025-03-10T00:00:00.000Z");
    expect(a.seed).toBeNull();

    const secret = db.rows("draw_secrets")[0];
    expect(sha(String(secret.seed))).toBe(a.seed_hash);
    expect(drandRoundTime(a.randomness_round).getTime()).toBeGreaterThan(Date.parse(a.closes_at));
  });
});

describe("runLifecycle", () => {
  it("closes last week's draw, draws the winner, and opens the new week", async () => {
    const d = await ensureDrawForWeek(WED);
    addEntries(d.id, 2500); // more than one PostgREST page
    db.rows("pot_contributions").push(
      { id: "c1", draw_id: d.id, source: "sponsor", amount: 1000 },
      { id: "c2", draw_id: d.id, source: "ads", amount: 234.56 },
    );

    const report = await runLifecycle(NEXT_MON);
    expect(report.closed).toBe(1);
    expect(report.results).toEqual([{ drawId: d.id, outcome: "drawn" }]);
    expect(report.currentDrawId).not.toBe(d.id);

    const done = draw(d.id);
    const seed = String(db.rows("draw_secrets").find((s) => s.draw_id === d.id)!.seed);
    const expected = winnerIndex(seed, RANDOMNESS, 2500);
    expect(done.status).toBe("drawn");
    expect(done.seed).toBe(seed);
    expect(done.randomness).toBe(RANDOMNESS);
    expect(done.total_entries).toBe(2500);
    expect(done.winner_index).toBe(expected);
    expect(done.winning_entry_id).toBe(`entry-${String(expected).padStart(5, "0")}`);
    expect(done.prize_amount).toBe(1234.56);

    const [winner] = db.rows("winners");
    expect(winner).toMatchObject({ draw_id: d.id, amount: 1234.56, status: "pending" });

    // Idempotent: running again changes nothing.
    const again = await runLifecycle(NEXT_MON);
    expect(again.results).toEqual([]);
    expect(db.rows("winners")).toHaveLength(1);
  });

  it("waits when the drand round isn't out yet", async () => {
    const d = await ensureDrawForWeek(WED);
    addEntries(d.id, 3);
    const justClosed = new Date(Date.parse(d.closes_at) + 1000);
    const report = await runLifecycle(justClosed);
    expect(report.results).toEqual([{ drawId: d.id, outcome: "waiting" }]);
    expect(draw(d.id).status).toBe("closed");
  });

  it("rolls the pot over when nobody entered", async () => {
    const d = await ensureDrawForWeek(WED);
    db.rows("pot_contributions").push({ id: "c1", draw_id: d.id, source: "sponsor", amount: 500 });

    const report = await runLifecycle(NEXT_MON);
    expect(report.results[0].outcome).toBe("rolled_over");
    const rollover = db.rows("pot_contributions").find((c) => c.source === "rollover");
    expect(rollover).toMatchObject({ draw_id: report.currentDrawId, amount: 500 });
  });

  it("forfeits unclaimed prizes into the current pot after the deadline", async () => {
    const d = await ensureDrawForWeek(WED);
    addEntries(d.id, 10);
    db.rows("pot_contributions").push({ id: "c1", draw_id: d.id, source: "sponsor", amount: 300 });
    await runLifecycle(NEXT_MON);

    const later = new Date("2025-04-20T00:05:00Z"); // > 30 days on
    const report = await runLifecycle(later);
    expect(report.forfeited).toBe(1);
    expect(db.rows("winners")[0].status).toBe("forfeited");
    const rollover = db.rows("pot_contributions").find((c) => c.source === "rollover");
    expect(rollover).toMatchObject({ draw_id: report.currentDrawId, amount: 300 });
  });

  it("refuses to draw if the stored seed doesn't match the published hash", async () => {
    const d = await ensureDrawForWeek(WED);
    addEntries(d.id, 5);
    db.rows("draw_secrets")[0].seed = "tampered";
    const report = await runLifecycle(NEXT_MON);
    expect(report.results[0].outcome).toMatch(/does not match/);
    expect(draw(d.id).status).toBe("closed");
  });
});

describe("fetchDrawEntries", () => {
  it("returns every entry across pages in (created_at, id) order", async () => {
    addEntries("d1", 2000);
    const res = await fetchDrawEntries("d1");
    expect(res.ok && res.entries.length).toBe(2000);
    expect(res.ok && res.entries[1999].id).toBe("entry-01999");
  });
});
