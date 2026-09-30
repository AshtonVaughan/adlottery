import { z } from "zod";
import { isCountryCode } from "@/lib/countries";

export const profileSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(2, "Enter a name of at least 2 characters.")
    .max(40, "Keep the name under 40 characters."),
  country_code: z.string().refine(isCountryCode, "Choose your country of residence."),
  confirm_adult: z.literal(true, { errorMap: () => ({ message: "You must be 18 or older." }) }),
  accept_rules: z.literal(true, { errorMap: () => ({ message: "Accept the official rules to continue." }) }),
});

export const claimSchema = z.object({
  draw_id: z.string().uuid(),
  legal_name: z.string().trim().min(2, "Enter your full legal name.").max(120),
  payout_details: z
    .string()
    .trim()
    .min(5, "Tell us where to send the prize (e.g. your PayPal email).")
    .max(500),
});

export const contributionSchema = z.object({
  draw_id: z.string().uuid(),
  source: z.enum(["sponsor", "ads"]),
  amount: z.coerce.number().positive().max(10_000_000),
  note: z.string().trim().max(200).optional().default(""),
});

export const sponsorSchema = z.object({
  draw_id: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  url: z.string().trim().url().or(z.literal("")).optional().default(""),
  tagline: z.string().trim().max(120).optional().default(""),
});

export const winnerUpdateSchema = z.object({
  status: z.enum(["verified", "paid", "forfeited"]),
  payout_reference: z.string().trim().max(200).optional().default(""),
});

export const banSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  banned: z.boolean(),
});

export function firstError(error: z.ZodError): string {
  return error.errors[0]?.message ?? "Invalid input.";
}
