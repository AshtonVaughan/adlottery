export type DrawStatus = "open" | "closed" | "drawn";
export type ContributionSource = "sponsor" | "ads" | "rollover";
export type WinnerStatus = "pending" | "claimed" | "verified" | "paid" | "forfeited";
export type EntryBlock = "needs_profile" | "banned" | "excluded_country" | "draw_closed";

export interface Draw {
  id: string;
  week_start: string;
  opens_at: string;
  closes_at: string;
  status: DrawStatus;
  currency: string;
  sponsor_id: string | null;
  seed_hash: string;
  randomness_round: number;
  seed: string | null;
  randomness: string | null;
  total_entries: number | null;
  winner_index: number | null;
  winning_entry_id: string | null;
  prize_amount: number | null;
  drawn_at: string | null;
}

export interface PotSummary {
  total: number;
  sponsor: number;
  ads: number;
  rollover: number;
}

export interface Sponsor {
  id: string;
  name: string;
  url: string | null;
  tagline: string | null;
}

export interface DrawView {
  draw: Draw;
  pot: PotSummary;
  entries: number;
  sponsor: Sponsor | null;
  winner: { name: string; country: string | null; status: WinnerStatus } | null;
}

export interface Contribution {
  id: string;
  source: ContributionSource;
  amount: number;
  note: string | null;
}

export interface Winning {
  draw_id: string;
  week_start: string;
  amount: number;
  currency: string;
  status: WinnerStatus;
  claim_deadline: string;
}

export interface MyStatus {
  profile: { email: string; display_name: string | null; country_code: string | null };
  is_admin: boolean;
  draw_id: string;
  week_start: string;
  block: EntryBlock | null;
  entries: number;
  entered_today: boolean;
  my_entry_ids: string[];
  winnings: Winning[];
}

export interface AdminWinner extends Winning {
  legal_name: string | null;
  payout_details: string | null;
  payout_reference: string | null;
  email: string | null;
  display_name: string | null;
  country_code: string | null;
}

export interface AdminOverview {
  current: DrawView;
  winners: AdminWinner[];
}
