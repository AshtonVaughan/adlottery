function list(value: string | undefined, fallback: string): string[] {
  return (value || fallback)
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

// Everything here is public and baked in at build time. The hourly job
// syncs the rule-related values into the database, which enforces them.
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "The Weekly Pot";
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") + BASE_PATH;
export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "USD";
export const AD_SHARE_PERCENT = Number(process.env.NEXT_PUBLIC_AD_SHARE_PERCENT || 50);
export const EXCLUDED_COUNTRIES = list(process.env.NEXT_PUBLIC_EXCLUDED_COUNTRIES, "CU,IR,KP,SY,RU,BY");
export const RULES_VERSION = "2026-10-01";
export const MIN_AGE = 18;
export const CLAIM_WINDOW_DAYS = 30;
export const SPONSOR_CONTACT = process.env.NEXT_PUBLIC_SPONSOR_CONTACT || "sponsors@example.com";
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const DEMO = !SUPABASE_URL || !SUPABASE_ANON_KEY;
