export type EligibilityStatus =
  | "eligible"
  | "restricted"
  | "waitlisted"
  | "blocked";

export type JurisdictionStatus = "open" | "restricted" | "waitlist" | "blocked";

export type DrawType =
  | "weekly_draw"
  | "monthly_grand_draw"
  | "threshold_draw"
  | "sponsored_draw";

export type DrawStatus =
  | "draft"
  | "active"
  | "locked"
  | "drawn"
  | "cancelled";

export type EntrySource =
  | "daily_free_entry"
  | "referral_bonus"
  | "promo_code"
  | "manual_adjustment"
  | "sponsor_challenge";

export type ClaimStatus =
  | "pending"
  | "verification_required"
  | "skill_question_required"
  | "verified"
  | "rejected"
  | "expired";

export type PayoutStatus =
  | "not_started"
  | "pending"
  | "paid"
  | "failed"
  | "cancelled";

export type WinnerDisplayMode = "full" | "partial" | "anonymous";

export interface Jurisdiction {
  id: string;
  country_code: string;
  region_code: string;
  display_name: string;
  status: JurisdictionStatus;
  min_age: number;
  currency: string;
  requires_skill_question: boolean;
  requires_permit_above_amount: number | null;
  prize_cap_amount: number | null;
  kyc_required_before_payout: boolean;
  public_winner_display_mode: WinnerDisplayMode;
  allowed_entry_methods: string[];
  blocked_entry_methods: string[];
  terms_version: string;
  privacy_version: string;
  draw_rules_version: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  dob: string;
  country_code: string;
  region_code: string;
  state_or_province: string | null;
  is_admin: boolean;
  referral_code: string;
  referred_by: string | null;
  terms_accepted_at: string;
  privacy_accepted_at: string;
  draw_rules_accepted_at: string;
  eligibility_status: EligibilityStatus;
  banned_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Draw {
  id: string;
  title: string;
  draw_type: DrawType;
  prize_amount: number;
  currency: string;
  region_code: string | null;
  eligible_country_codes: string[];
  excluded_country_codes: string[];
  starts_at: string;
  ends_at: string;
  status: DrawStatus;
  public_seed: string | null;
  public_seed_hash: string | null;
  randomness_source: string | null;
  winning_entry_id: string | null;
  sponsor_name: string | null;
  sponsor_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Entry {
  id: string;
  user_id: string;
  draw_id: string;
  source: EntrySource;
  source_ref: string | null;
  ip_hash: string | null;
  device_hash: string | null;
  country_code: string;
  region_code: string;
  created_at: string;
}

export interface WinnerClaim {
  id: string;
  draw_id: string;
  user_id: string;
  winning_entry_id: string;
  claim_status: ClaimStatus;
  identity_status: string | null;
  skill_question_required: boolean;
  skill_question_answered: boolean;
  skill_question_correct: boolean | null;
  payout_status: PayoutStatus;
  payout_reference: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}
