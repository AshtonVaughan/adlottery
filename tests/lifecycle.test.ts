import { describe, it, expect, vi } from "vitest";
import { freshDb } from "./db";
import { runLifecycle, syncSettings, type RpcClient } from "@/lib/lifecycle";

const RANDOM = "cd".repeat(32);

/** Adapts the PGlite test database to the supabase-js rpc() shape. */
function rpcClient(db: Awaited<ReturnType<typeof freshDb>>): RpcClient {
  return {
    async rpc(fn, args = {}) {
      const names = Object.keys(args);
      const sql = `select ${fn}(${names.map((n, i) => `${n} => $${i + 1}`).join(", ")}) as r`;
      try {
        const [row] = await db.q<{ r: unknown }>(sql, names.map((n) => args[n]));
        return { data: row?.r ?? null, error: null };
      } catch (err) {
        return { data: null, error: { message: (err as Error).message } };
      }
    },
  };
}

describe("runLifecycle", () => {
  it("draws last week's winner, emails them, and is idempotent", async () => {
    const db = await freshDb();
    const client = rpcClient(db);
    const { id: drawId } = await db.one<{ id: string }>("select id from _ensure_draw_for('2025-03-05T12:00:00Z')");
    const uid = await db.createUser("winner@x.com", { name: "Wendy", country: "AU" });
    await db.q("insert into entries (draw_id, user_id, entry_date) values ($1, $2, '2025-03-05')", [drawId, uid]);
    await db.q("insert into pot_contributions (draw_id, source, amount) values ($1, 'sponsor', 250)", [drawId]);

    const fetchRandomness = vi.fn().mockResolvedValue({ ok: true, randomness: RANDOM });
    const send = vi.fn().mockResolvedValue(undefined);
    const now = new Date("2025-03-10T00:07:00Z");

    const report = await runLifecycle(client, { now, fetchRandomness, send });
    expect(report).toMatchObject({ closed: 1, results: [{ drawId, outcome: "drawn" }] });
    expect(send).toHaveBeenCalledOnce();
    expect(send.mock.calls[0][0]).toMatchObject({ to: "winner@x.com", subject: expect.stringContaining("$250") });

    const again = await runLifecycle(client, { now, fetchRandomness, send });
    expect(again.results).toEqual([]);
    expect(send).toHaveBeenCalledOnce();
  });

  it("reports beacon failures without drawing", async () => {
    const db = await freshDb();
    const { id } = await db.one<{ id: string }>("select id from _ensure_draw_for('2025-03-05T12:00:00Z')");
    const report = await runLifecycle(rpcClient(db), {
      now: new Date("2025-03-10T00:07:00Z"),
      fetchRandomness: vi.fn().mockResolvedValue({ ok: false, reason: "relays down" }),
      send: vi.fn(),
    });
    expect(report.results).toEqual([{ drawId: id, outcome: "error: relays down" }]);
    expect((await db.one<{ status: string }>("select status from draws where id = $1", [id])).status).toBe("closed");
  });

  it("syncs settings", async () => {
    const db = await freshDb();
    await syncSettings(rpcClient(db), {
      excludedCountries: ["CU", "IR"], adSharePercent: 60, rulesVersion: "v2", currency: "EUR", adminEmails: [],
    });
    const s = await db.one<{ currency: string; rules_version: string }>("select * from app_settings");
    expect(s).toMatchObject({ currency: "EUR", rules_version: "v2" });
  });
});
