export type DrawStatus = "open" | "closed" | "drawn" | "cancelled";
export type ContributionSource = "sponsor" | "ads" | "rollover";
export type WinnerStatus = "pending" | "claimed" | "verified" | "paid" | "forfeited";

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  country_code: string | null;
  confirmed_adult_at: string | null;
  accepted_rules_version: string | null;
  is_admin: boolean;
  banned_at: string | null;
  created_at: string;
}

export interface Sponsor {
  id: string;
  name: string;
  url: string | null;
  tagline: string | null;
}

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
  created_at: string;
}

export interface Contribution {
  id: string;
  draw_id: string;
  source: ContributionSource;
  amount: number;
  note: string | null;
  created_at: string;
}

export interface Winner {
  draw_id: string;
  user_id: string | null;
  entry_id: string;
  amount: number;
  currency: string;
  status: WinnerStatus;
  legal_name: string | null;
  payout_details: string | null;
  payout_reference: string | null;
  claim_deadline: string;
  claimed_at: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface PotSummary {
  total: number;
  sponsor: number;
  ads: number;
  rollover: number;
}
