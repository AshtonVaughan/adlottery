import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureDrawForWeek } from "@/lib/draw";
import { commitmentRoundForDraw } from "@/lib/drand";
import { sha256Hex } from "@/lib/hash";
import { summarizePot } from "@/lib/pot";
import { isSupabaseConfigured, CURRENCY } from "@/lib/config";
import { utcDateKey, weekBounds } from "@/lib/week";
import type { Contribution, Draw, PotSummary, Sponsor, Winner, WinnerStatus } from "@/lib/types";

export interface PublicWinner {
  name: string;
  country: string | null;
  status: WinnerStatus;
}

export interface DrawView {
  draw: Draw;
  pot: PotSummary;
  entries: number;
  sponsor: Sponsor | null;
  winner: PublicWinner | null;
}

export interface HomeData {
  demo: boolean;
  current: DrawView | null;
  last: DrawView | null;
}

// ------------------------------------------------------------------
// Demo data, shown only when Supabase env vars are missing.
// ------------------------------------------------------------------
function demoDraw(weekOffset: number, status: Draw["status"]): Draw {
  const now = new Date(Date.now() + weekOffset * 7 * 86_400_000);
  const { weekStart, opensAt, closesAt } = weekBounds(now);
  const seed = `demo-seed-${weekStart}`;
  const drawn = status === "drawn";
  return {
    id: `demo-${weekStart}`,
    week_start: weekStart,
    opens_at: opensAt.toISOString(),
    closes_at: closesAt.toISOString(),
    status,
    currency: CURRENCY,
    sponsor_id: null,
    seed_hash: sha256Hex(seed),
    randomness_round: commitmentRoundForDraw(closesAt.toISOString(), opensAt),
    seed: drawn ? seed : null,
    randomness: drawn ? sha256Hex(`demo-randomness-${weekStart}`) : null,
    total_entries: drawn ? 3921 : null,
    winner_index: drawn ? 2210 : null,
    winning_entry_id: null,
    prize_amount: drawn ? 1184.5 : null,
    drawn_at: drawn ? closesAt.toISOString() : null,
    created_at: opensAt.toISOString(),
  };
}

const DEMO_SPONSOR: Sponsor = {
  id: "demo-sponsor",
  name: "Example Co.",
  url: "https://example.com",
  tagline: "Putting $1,000 in the pot this week",
};

function demoHome(): HomeData {
  return {
    demo: true,
    current: {
      draw: demoDraw(0, "open"),
      pot: { sponsor: 1000, ads: 312.4, rollover: 0, total: 1312.4 },
      entries: 4812,
      sponsor: DEMO_SPONSOR,
      winner: null,
    },
    last: {
      draw: demoDraw(-1, "drawn"),
      pot: { sponsor: 1000, ads: 184.5, rollover: 0, total: 1184.5 },
      entries: 3921,
      sponsor: DEMO_SPONSOR,
      winner: { name: "Maya R.", country: "BR", status: "paid" },
    },
  };
}

// ------------------------------------------------------------------
// Live data
// ------------------------------------------------------------------
async function buildView(draw: Draw): Promise<DrawView> {
  const db = getSupabaseAdminClient();
  const [contribRes, countRes, sponsorRes, winnerRes] = await Promise.all([
    db.from("pot_contributions").select("source, amount").eq("draw_id", draw.id),
    draw.total_entries === null
      ? db.from("entries").select("id", { head: true, count: "exact" }).eq("draw_id", draw.id)
      : Promise.resolve({ count: draw.total_entries }),
    draw.sponsor_id
      ? db.from("sponsors").select("*").eq("id", draw.sponsor_id).maybeSingle<Sponsor>()
      : Promise.resolve({ data: null }),
    draw.status === "drawn"
      ? db
          .from("winners")
          .select("status, profiles(display_name, country_code)")
          .eq("draw_id", draw.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const w = winnerRes.data as
    | { status: WinnerStatus; profiles: { display_name: string | null; country_code: string | null } | null }
    | null;

  return {
    draw,
    pot: summarizePot((contribRes.data ?? []) as Contribution[]),
    entries: countRes.count ?? 0,
    sponsor: sponsorRes.data ?? null,
    winner: w
      ? {
          name: w.profiles?.display_name ?? "Former member",
          country: w.profiles?.country_code ?? null,
          status: w.status,
        }
      : null,
  };
}

export async function getHomeData(): Promise<HomeData> {
  if (!isSupabaseConfigured()) return demoHome();
  const db = getSupabaseAdminClient();

  let current: Draw | null = null;
  try {
    current = await ensureDrawForWeek();
  } catch (err) {
    console.error("[home] could not load current draw", err);
  }

  const { data: last } = await db
    .from("draws")
    .select("*")
    .eq("status", "drawn")
    .order("week_start", { ascending: false })
    .limit(1)
    .maybeSingle<Draw>();

  return {
    demo: false,
    current: current ? await buildView(current) : null,
    last: last ? await buildView(last) : null,
  };
}

export async function getDrawView(id: string): Promise<DrawView | null> {
  if (!isSupabaseConfigured()) {
    const demo = demoHome();
    return [demo.current, demo.last].find((v) => v?.draw.id === id) ?? null;
  }
  const { data: draw } = await getSupabaseAdminClient()
    .from("draws")
    .select("*")
    .eq("id", id)
    .maybeSingle<Draw>();
  return draw ? buildView(draw) : null;
}

export async function getContributions(drawId: string, demoPot?: PotSummary): Promise<Contribution[]> {
  if (!isSupabaseConfigured()) {
    const at = new Date().toISOString();
    const ads = demoPot?.ads ?? 0;
    return [
      { id: "d1", draw_id: drawId, source: "sponsor", amount: demoPot?.sponsor ?? 0, note: "Example Co.", created_at: at },
      { id: "d2", draw_id: drawId, source: "ads", amount: ads, note: `50% of $${(ads * 2).toFixed(2)} ad revenue`, created_at: at },
    ];
  }
  const { data } = await getSupabaseAdminClient()
    .from("pot_contributions")
    .select("*")
    .eq("draw_id", drawId)
    .order("created_at", { ascending: true });
  return (data ?? []) as Contribution[];
}

export async function getPastDraws(limit = 52): Promise<DrawView[]> {
  if (!isSupabaseConfigured()) {
    const demo = demoHome();
    return demo.last ? [demo.last] : [];
  }
  const { data } = await getSupabaseAdminClient()
    .from("draws")
    .select("*")
    .eq("status", "drawn")
    .order("week_start", { ascending: false })
    .limit(limit);
  return Promise.all(((data ?? []) as Draw[]).map(buildView));
}

export interface UserDrawStatus {
  entriesThisDraw: number;
  enteredToday: boolean;
}

export async function getUserDrawStatus(userId: string, drawId: string): Promise<UserDrawStatus> {
  const { data } = await getSupabaseAdminClient()
    .from("entries")
    .select("entry_date")
    .eq("draw_id", drawId)
    .eq("user_id", userId);
  const today = utcDateKey(new Date());
  return {
    entriesThisDraw: data?.length ?? 0,
    enteredToday: (data ?? []).some((e) => e.entry_date === today),
  };
}

export async function getUserWinnings(userId: string): Promise<(Winner & { week_start: string })[]> {
  const { data } = await getSupabaseAdminClient()
    .from("winners")
    .select("*, draws(week_start)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as (Winner & { draws: { week_start: string } })[]).map((w) => ({
    ...w,
    week_start: w.draws.week_start,
  }));
}
