function list(value: string | undefined, fallback: string): string[] {
  return (value ?? fallback)
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "The Weekly Pot";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "USD";

/** Share of gross ad revenue that goes into the pot. Published on the site. */
export const AD_SHARE_PERCENT = Number(process.env.NEXT_PUBLIC_AD_SHARE_PERCENT || 50);

/**
 * Countries that can't enter. Defaults cover comprehensively sanctioned
 * jurisdictions; counsel should extend it for local prize-promotion law.
 */
export const EXCLUDED_COUNTRIES = list(
  process.env.NEXT_PUBLIC_EXCLUDED_COUNTRIES,
  "CU,IR,KP,SY,RU,BY",
);

export const MIN_AGE = 18;
export const RULES_VERSION = "2026-10-01";
export const CLAIM_WINDOW_DAYS = 30;
export const SPONSOR_CONTACT = process.env.NEXT_PUBLIC_SPONSOR_CONTACT || "sponsors@example.com";

export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
