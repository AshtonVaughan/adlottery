import { commitmentRoundForDraw } from "@/lib/drand";
import { weekBounds } from "@/lib/week";
import { CURRENCY } from "@/lib/config";
import type { Contribution, Draw, DrawView, Sponsor } from "@/lib/types";

// Sample data for demo mode (no Supabase configured). Hashes are fixed
// placeholders; nothing here is verifiable.
const SEED_HASH = "74f9b41e57a5fce2148f0152d59bc5439f5731d1a34c3ab41e242eb1b34ea2b5";
const SEED = "3c7e0f1d9a2b4c6e8f0a1b3c5d7e9f1a2b4c6d8e0f1a3b5c7d9e1f3a5b7c9d1e";
const RANDOMNESS = "48186569995f1b294d023277f05fe4b25cdb2ecaa2922b2a8e5bfc6e82411418";

function demoDraw(weekOffset: number, drawn: boolean): Draw {
  const { weekStart, opensAt, closesAt } = weekBounds(new Date(Date.now() + weekOffset * 7 * 86_400_000));
  return {
    id: `demo-${weekStart}`,
    week_start: weekStart,
    opens_at: opensAt.toISOString(),
    closes_at: closesAt.toISOString(),
    status: drawn ? "drawn" : "open",
    currency: CURRENCY,
    sponsor_id: "demo",
    seed_hash: SEED_HASH,
    randomness_round: commitmentRoundForDraw(closesAt.toISOString(), opensAt),
    seed: drawn ? SEED : null,
    randomness: drawn ? RANDOMNESS : null,
    total_entries: drawn ? 3921 : null,
    winner_index: drawn ? 2210 : null,
    winning_entry_id: null,
    prize_amount: drawn ? 1184.5 : null,
    drawn_at: drawn ? closesAt.toISOString() : null,
  };
}

const SPONSOR: Sponsor = { id: "demo", name: "Example Co.", url: "https://example.com", tagline: "Putting $1,000 in the pot this week" };

export function demoCurrent(): DrawView {
  return {
    draw: demoDraw(0, false),
    pot: { sponsor: 1000, ads: 312.4, rollover: 0, total: 1312.4 },
    entries: 4812,
    sponsor: SPONSOR,
    winner: null,
  };
}

export function demoLast(): DrawView {
  return {
    draw: demoDraw(-1, true),
    pot: { sponsor: 1000, ads: 184.5, rollover: 0, total: 1184.5 },
    entries: 3921,
    sponsor: SPONSOR,
    winner: { name: "Maya R.", country: "BR", status: "paid" },
  };
}

export function demoContributions(view: DrawView): Contribution[] {
  return [
    { id: "d1", source: "sponsor", amount: view.pot.sponsor, note: SPONSOR.name },
    { id: "d2", source: "ads", amount: view.pot.ads, note: `50% of ${CURRENCY} ${(view.pot.ads * 2).toFixed(2)} ad revenue` },
  ];
}
