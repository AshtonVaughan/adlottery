import { describe, it, expect, beforeEach } from "vitest";
import { freshDb, type TestDb } from "./db";
import { winnerIndex, sha256Hex } from "@/lib/hash";
import { commitmentRoundForDraw, drandRoundAt, drandRoundTime } from "@/lib/drand";
import { weekLabel } from "@/lib/week";

let db: TestDb;
beforeEach(async () => {
  db = await freshDb();
});

const WED = "2025-03-05T12:00:00Z";
const NEXT_MON = "2025-03-10T00:05:00Z";
const RANDOM = "ab".repeat(32);

async function drawFor(now: string) {
  return db.one<{ id: string; week_start: Date; closes_at: Date; seed_hash: string; randomness_round: string; status: string }>(
    "select * from _ensure_draw_for($1)",
    [now],
  );
}

async function addEntries(drawId: string, n: number, userId: string | null = null) {
  await db.q(
    `insert into entries (draw_id, user_id, entry_date, created_at)
     select $1, $2, date '2000-01-01' + g, timestamptz '2025-03-05 00:00:00+00' + (g || ' seconds')::interval
     from generate_series(1, $3) g`,
    [drawId, userId, n],
  );
}

async function sponsor(drawId: string, amount: number) {
  await db.q("insert into pot_contributions (draw_id, source, amount) values ($1, 'sponsor', $2)", [drawId, amount]);
}

describe("SQL mirrors the TypeScript maths", () => {
  it("winner_index matches src/lib/hash.ts", async () => {
    for (const [seed, n] of [["a", 1], ["seed-x", 100], ["f".repeat(64), 2500], ["z", 999_983]] as const) {
      const { i } = await db.one<{ i: number }>("select winner_index($1, $2, $3) i", [seed, RANDOM, n]);
      expect(i).toBe(winnerIndex(seed, RANDOM, n));
    }
  });
  it("sha256_hex matches", async () => {
    const { h } = await db.one<{ h: string }>("select sha256_hex('héllo|x') h");
    expect(h).toBe(sha256Hex("héllo|x"));
  });
  it("drand round maths matches src/lib/drand.ts", async () => {
    for (const t of ["2025-01-01T00:00:00Z", "2026-09-30T13:37:01.5Z", "2023-08-23T15:09:27Z"]) {
      const { r } = await db.one<{ r: string }>("select drand_round_at($1) r", [t]);
      expect(Number(r)).toBe(drandRoundAt(new Date(t)));
      const { at } = await db.one<{ at: Date }>("select drand_round_time($1) at", [Number(r)]);
      expect(at.getTime()).toBe(drandRoundTime(Number(r)).getTime());
    }
  });
  it("week_label matches, including ISO years", async () => {
    for (const w of ["2026-09-28", "2024-12-30", "2021-01-04"]) {
      const { l } = await db.one<{ l: string }>("select week_label($1) l", [w]);
      expect(l).toBe(weekLabel(w));
    }
  });
});

describe("draw creation", () => {
  it("creates one Monday-to-Monday draw per week, committing to a hidden seed", async () => {
    const a = await drawFor(WED);
    const b = await drawFor("2025-03-09T23:59:59Z");
    expect(b.id).toBe(a.id);
    expect(a.closes_at.toISOString()).toBe("2025-03-10T00:00:00.000Z");
    expect(Number(a.randomness_round)).toBe(commitmentRoundForDraw("2025-03-10T00:00:00Z", new Date(WED)));

    const { seed } = await db.one<{ seed: string }>("select seed from draw_secrets where draw_id = $1", [a.id]);
    expect(seed).toMatch(/^[0-9a-f]{64}$/);
    expect(sha256Hex(seed)).toBe(a.seed_hash);
  });

  it("never exposes secrets to the public", async () => {
    const d = await drawFor(WED);
    expect(await db.as("anon", null, "select * from draw_secrets")).toEqual([]);
    const [row] = await db.as<{ seed: string | null }>("anon", null, "select seed from draws where id = $1", [d.id]);
    expect(row.seed).toBeNull();
  });
});

describe("function permissions", () => {
  it("blocks the public from service-only functions", async () => {
    for (const sql of [
      `select _ensure_draw_for(now())`,
      `select _lifecycle_prepare(now())`,
      `select _complete_draw(gen_random_uuid(), '${RANDOM}', now())`,
      `select _sync_settings(null, null, null, null, array['me@x.com'])`,
      `select _rollover(100, 'x', now())`,
    ]) {
      await expect(db.as("anon", null, sql)).rejects.toThrow(/permission denied/);
      await expect(db.as("authenticated", crypto.randomUUID(), sql)).rejects.toThrow(/permission denied/);
    }
  });

  it("lets anyone read public data", async () => {
    const [{ home_data }] = await db.as<{ home_data: { current: { entries: number } } }>("anon", null, "select home_data()");
    expect(home_data.current.entries).toBe(0);
  });

  it("blocks admin functions for non-admins", async () => {
    const uid = await db.createUser("u@x.com", { name: "Sam", country: "AU" });
    await expect(db.as("authenticated", uid, "select admin_overview()")).rejects.toThrow(/Admins only/);
    await expect(db.as("authenticated", uid, "select admin_set_ban('u@x.com', true)")).rejects.toThrow(/Admins only/);
    await expect(db.as("anon", null, "select admin_overview()")).rejects.toThrow(/permission denied/);
  });

  it("only shows users their own entries and prizes", async () => {
    const a = await db.createUser("a@x.com", { name: "Al", country: "AU" });
    const b = await db.createUser("b@x.com", { name: "Bo", country: "GB" });
    await db.as("authenticated", a, "select enter_draw()");
    await db.as("authenticated", b, "select enter_draw()");
    expect(await db.as("authenticated", a, "select user_id from entries")).toEqual([{ user_id: a }]);
    expect(await db.as("anon", null, "select * from entries")).toEqual([]);
    expect(await db.as("authenticated", a, "select id from profiles")).toEqual([{ id: a }]);
  });
});

describe("entering", () => {
  it("requires a complete profile, then allows one entry per day", async () => {
    const uid = await db.createUser("sam@x.com");
    await expect(db.as("authenticated", uid, "select enter_draw()")).rejects.toThrow("needs_profile");

    await db.as("authenticated", uid, "select save_profile('Sam R.', 'AU', true, true)");
    const [first] = await db.as<{ enter_draw: { entered: boolean; entries: number } }>("authenticated", uid, "select enter_draw()");
    expect(first.enter_draw).toEqual({ entered: true, entries: 1 });
    const [again] = await db.as<{ enter_draw: { entered: boolean; entries: number } }>("authenticated", uid, "select enter_draw()");
    expect(again.enter_draw).toEqual({ entered: false, entries: 1 });

    const [{ my_status }] = await db.as<{ my_status: { entered_today: boolean; entries: number; block: null } }>(
      "authenticated", uid, "select my_status()");
    expect(my_status).toMatchObject({ entered_today: true, entries: 1, block: null });
  });

  it("rejects signed-out, banned, excluded-country and outdated-rules users", async () => {
    await expect(db.as("anon", null, "select enter_draw()")).rejects.toThrow(/permission denied/);

    const banned = await db.createUser("b@x.com", { name: "Bo", country: "AU" });
    await db.q("update profiles set banned_at = now() where id = $1", [banned]);
    await expect(db.as("authenticated", banned, "select enter_draw()")).rejects.toThrow("banned");

    const excluded = await db.createUser("k@x.com", { name: "Kim", country: "KP" });
    await expect(db.as("authenticated", excluded, "select enter_draw()")).rejects.toThrow("excluded_country");

    const stale = await db.createUser("s@x.com", { name: "Sue", country: "AU" });
    await db.q("update app_settings set rules_version = '2099-01-01'");
    await expect(db.as("authenticated", stale, "select enter_draw()")).rejects.toThrow("needs_profile");
  });

  it("validates profiles and locks the country once set", async () => {
    const uid = await db.createUser("p@x.com");
    await expect(db.as("authenticated", uid, "select save_profile('S', 'AU', true, true)")).rejects.toThrow(/2 to 40/);
    await expect(db.as("authenticated", uid, "select save_profile('Sam', 'AU', false, true)")).rejects.toThrow(/18/);
    await expect(db.as("authenticated", uid, "select save_profile('Sam', 'au', true, true)")).rejects.toThrow(/country/);
    await db.as("authenticated", uid, "select save_profile('Sam', 'AU', true, true)");
    await expect(db.as("authenticated", uid, "select save_profile('Sam', 'NZ', true, true)")).rejects.toThrow(/support/);
  });
});

describe("weekly lifecycle", () => {
  it("closes, waits for the beacon, then draws the right winner across >1000 entries", async () => {
    const d = await drawFor(WED);
    const winnerUser = await db.createUser("w@x.com", { name: "Maya R.", country: "BR" });
    await addEntries(d.id, 2500, winnerUser);
    await sponsor(d.id, 1000);
    await db.q("insert into pot_contributions (draw_id, source, amount) values ($1, 'ads', 234.56)", [d.id]);

    // Just after closing, the drand round isn't out yet.
    const early = await db.one<{ p: { closed: number; ready: unknown[]; waiting: number } }>(
      "select _lifecycle_prepare('2025-03-10T00:00:01Z') p");
    expect(early.p).toMatchObject({ closed: 1, ready: [], waiting: 1 });
    await expect(db.q(`select _complete_draw($1, '${RANDOM}', '2025-03-10T00:00:01Z')`, [d.id])).rejects.toThrow(/not released/);

    const prep = await db.one<{ p: { ready: { id: string; round: number }[] } }>("select _lifecycle_prepare($1) p", [NEXT_MON]);
    expect(prep.p.ready).toEqual([{ id: d.id, round: Number(d.randomness_round) }]);

    const { r } = await db.one<{ r: Record<string, unknown> }>("select _complete_draw($1, $2, $3) r", [d.id, RANDOM, NEXT_MON]);
    const { seed } = await db.one<{ seed: string }>("select seed from draw_secrets where draw_id = $1", [d.id]);
    const expected = winnerIndex(seed, RANDOM, 2500);
    expect(r).toMatchObject({ status: "drawn", amount: 1234.56, winner_index: expected, total_entries: 2500, email: "w@x.com" });

    const ids = (await db.one<{ ids: string[] }>("select draw_entry_ids($1) ids", [d.id])).ids;
    const drawn = await db.one<{ winning_entry_id: string; seed: string; prize_amount: string }>(
      "select * from draws where id = $1", [d.id]);
    expect(ids).toHaveLength(2500);
    expect(drawn.winning_entry_id).toBe(ids[expected]);
    expect(drawn.seed).toBe(seed);
    expect(Number(drawn.prize_amount)).toBe(1234.56);

    const w = await db.one<{ status: string; amount: string }>("select * from winners where draw_id = $1", [d.id]);
    expect(w.status).toBe("pending");

    // Can't be drawn twice.
    await expect(db.q("select _complete_draw($1, $2, $3)", [d.id, RANDOM, NEXT_MON])).rejects.toThrow(/Draw is drawn/);
  });

  it("publishes the entry list only after the draw", async () => {
    const d = await drawFor(WED);
    await addEntries(d.id, 3);
    expect((await db.as<{ ids: null }>("anon", null, "select draw_entry_ids($1) ids", [d.id]))[0].ids).toBeNull();
  });

  it("rolls the pot over when nobody entered", async () => {
    const d = await drawFor(WED);
    await sponsor(d.id, 500);
    await db.q("select _lifecycle_prepare($1)", [NEXT_MON]);
    const { r } = await db.one<{ r: { status: string } }>("select _complete_draw($1, $2, $3) r", [d.id, RANDOM, NEXT_MON]);
    expect(r.status).toBe("rolled_over");
    const next = await drawFor(NEXT_MON);
    const { pot } = await db.one<{ pot: { rollover: number; total: number } }>("select pot_summary($1) pot", [next.id]);
    expect(pot).toMatchObject({ rollover: 500, total: 500 });
  });

  it("forfeits unclaimed prizes into the current pot after 30 days", async () => {
    const d = await drawFor(WED);
    const u = await db.createUser("w@x.com", { name: "Wendy", country: "AU" });
    await addEntries(d.id, 5, u);
    await sponsor(d.id, 300);
    await db.q("select _lifecycle_prepare($1)", [NEXT_MON]);
    await db.q("select _complete_draw($1, $2, $3)", [d.id, RANDOM, NEXT_MON]);

    const later = "2025-04-20T00:05:00Z";
    const { p } = await db.one<{ p: { forfeited: number } }>("select _lifecycle_prepare($1) p", [later]);
    expect(p.forfeited).toBe(1);
    const current = await drawFor(later);
    const { pot } = await db.one<{ pot: { rollover: number } }>("select pot_summary($1) pot", [current.id]);
    expect(pot.rollover).toBe(300);
  });

  it("refuses to draw if the seed doesn't match its published hash", async () => {
    const d = await drawFor(WED);
    await addEntries(d.id, 3);
    await db.q("update draw_secrets set seed = 'tampered'");
    await db.q("select _lifecycle_prepare($1)", [NEXT_MON]);
    await expect(db.q("select _complete_draw($1, $2, $3)", [d.id, RANDOM, NEXT_MON])).rejects.toThrow(/does not match/);
  });
});

describe("claims and admin", () => {
  async function drawnPrize() {
    const d = await drawFor(WED);
    const u = await db.createUser("w@x.com", { name: "Wendy", country: "AU" });
    await addEntries(d.id, 1, u);
    await sponsor(d.id, 100);
    await db.q("select _lifecycle_prepare($1)", [NEXT_MON]);
    await db.q("select _complete_draw($1, $2, $3)", [d.id, RANDOM, NEXT_MON]);
    // Make the claim window current relative to the real clock.
    await db.q("update winners set claim_deadline = now() + interval '30 days'");
    const admin = await db.createUser("admin@x.com", { name: "Admin", country: "AU", admin: true });
    return { drawId: d.id, winner: u, admin };
  }

  it("runs the claim -> verify -> paid flow", async () => {
    const { drawId, winner, admin } = await drawnPrize();
    const other = await db.createUser("o@x.com", { name: "Olly", country: "AU" });
    await expect(db.as("authenticated", other, "select claim_prize($1, 'Other Person', 'paypal: o@x.com')", [drawId]))
      .rejects.toThrow(/can't be claimed/);

    await db.as("authenticated", winner, "select claim_prize($1, 'Wendy Winner', 'paypal: w@x.com')", [drawId]);
    await expect(db.as("authenticated", admin, "select admin_update_winner($1, 'paid', 'ref')", [drawId]))
      .rejects.toThrow(/from the current state/);
    await db.as("authenticated", admin, "select admin_update_winner($1, 'verified', null)", [drawId]);
    await db.as("authenticated", admin, "select admin_update_winner($1, 'paid', 'WISE-123')", [drawId]);
    const w = await db.one<{ status: string; payout_reference: string }>("select * from winners");
    expect(w).toMatchObject({ status: "paid", payout_reference: "WISE-123" });
  });

  it("adds sponsor money, the published share of ad revenue, and forfeits", async () => {
    const admin = await db.createUser("admin@x.com", { name: "Admin", country: "AU", admin: true });
    const [{ v }] = await db.as<{ v: string }>("authenticated", admin, "select admin_add_contribution('ads', 624.80, '') v");
    expect(Number(v)).toBe(312.4);
    await db.as("authenticated", admin, "select admin_add_contribution('sponsor', 1000, 'Example Co.')");
    await db.as("authenticated", admin, "select admin_set_sponsor('Example Co.', 'https://example.com', 'Hi')");
    const [{ o }] = await db.as<{ o: { current: { pot: { total: number; ads: number }; sponsor: { name: string } } } }>(
      "authenticated", admin, "select admin_overview() o");
    expect(o.current.pot).toMatchObject({ total: 1312.4, ads: 312.4 });
    expect(o.current.sponsor.name).toBe("Example Co.");
    const { note } = await db.one<{ note: string }>("select note from pot_contributions where source = 'ads'");
    expect(note).toBe("50% of USD 624.80 ad revenue");
  });

  it("bans by email and syncs admins from settings", async () => {
    const { admin } = await drawnPrize();
    await db.as("authenticated", admin, "select admin_set_ban('W@x.com', true)");
    expect((await db.one<{ banned_at: Date | null }>("select banned_at from profiles where email = 'w@x.com'")).banned_at).not.toBeNull();

    await db.q("select _sync_settings(array['CU'], 40, null, null, array['w@x.com'])");
    const admins = await db.q<{ email: string }>("select email from profiles where is_admin order by email");
    expect(admins).toEqual([{ email: "w@x.com" }]);
    const s = await db.one<{ ad_share_percent: string; excluded_countries: string[] }>("select * from app_settings");
    expect(Number(s.ad_share_percent)).toBe(40);
    expect(s.excluded_countries).toEqual(["CU"]);
  });
});
