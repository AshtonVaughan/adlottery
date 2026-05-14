import { z } from "zod";
import { SUPPORTED_COUNTRIES } from "@/lib/regions";

const COUNTRY_CODES = SUPPORTED_COUNTRIES.map((c) => c.code);

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12, "Use at least 12 characters."),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format."),
  country_code: z.string().refine((c) => COUNTRY_CODES.includes(c), {
    message: "Country not supported.",
  }),
  state_or_province: z.string().max(64).optional(),
  referral_code: z
    .string()
    .max(32)
    .regex(/^[A-Za-z0-9-]*$/)
    .optional(),
  accept_terms: z.literal(true),
  accept_privacy: z.literal(true),
  accept_draw_rules: z.literal(true),
  turnstile_token: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const waitlistSchema = z.object({
  email: z.string().email(),
  country_code: z.string().min(2).max(2),
  source: z.string().max(64).optional(),
});

export const claimEntrySchema = z.object({
  draw_id: z.string().uuid(),
  turnstile_token: z.string().optional(),
});

export const createDrawSchema = z.object({
  title: z.string().min(3).max(200),
  draw_type: z.enum([
    "weekly_draw",
    "monthly_grand_draw",
    "threshold_draw",
    "sponsored_draw",
  ]),
  prize_amount: z.coerce.number().positive(),
  currency: z.string().min(2).max(8).default("AUD"),
  region_code: z.string().max(64).optional().nullable(),
  eligible_country_codes: z.array(z.string().length(2)).min(1),
  excluded_country_codes: z.array(z.string().length(2)).default([]),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  sponsor_name: z.string().max(120).optional().nullable(),
  sponsor_url: z.string().url().optional().nullable(),
});

export const runDrawSchema = z.object({
  public_seed: z.string().min(8).max(256),
  randomness_source: z.string().min(4).max(256),
});

export const updateJurisdictionSchema = z.object({
  status: z.enum(["open", "restricted", "waitlist", "blocked"]),
  min_age: z.coerce.number().int().min(13).max(99),
  currency: z.string().min(2).max(8),
  requires_skill_question: z.boolean(),
  requires_permit_above_amount: z.coerce.number().nullable(),
  prize_cap_amount: z.coerce.number().nullable(),
  kyc_required_before_payout: z.boolean(),
  public_winner_display_mode: z.enum(["full", "partial", "anonymous"]),
  allowed_entry_methods: z.array(z.string()).default([]),
  blocked_entry_methods: z.array(z.string()).default([]),
  notes: z.string().max(2000).nullable().optional(),
});

export const skillAnswerSchema = z.object({
  answer: z.string().min(1).max(200),
});

export const winnerClaimUpdateSchema = z.object({
  claim_status: z
    .enum([
      "pending",
      "verification_required",
      "skill_question_required",
      "verified",
      "rejected",
      "expired",
    ])
    .optional(),
  payout_status: z
    .enum(["not_started", "pending", "paid", "failed", "cancelled"])
    .optional(),
  payout_reference: z.string().max(120).optional().nullable(),
  admin_notes: z.string().max(2000).optional().nullable(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type WaitlistInput = z.infer<typeof waitlistSchema>;
export type ClaimEntryInput = z.infer<typeof claimEntrySchema>;
export type CreateDrawInput = z.infer<typeof createDrawSchema>;
export type RunDrawInput = z.infer<typeof runDrawSchema>;
