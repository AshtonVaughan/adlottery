/**
 * Central brand + product constants. Everything user-visible reads from
 * here so we can rebrand by changing one file plus NEXT_PUBLIC_APP_NAME.
 */

export const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME?.trim() || "PLACEHOLDER_NAME";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";

export const DEFAULT_CURRENCY =
  process.env.DEFAULT_CURRENCY?.trim() || "AUD";

export const BRAND = {
  name: APP_NAME,
  url: APP_URL,
  supportEmail: `support@${stripScheme(APP_URL)}`,
  legalContactEmail: `legal@${stripScheme(APP_URL)}`,
  privacyContactEmail: `privacy@${stripScheme(APP_URL)}`,
  tagline: "Enter free prize draws from anywhere we're open.",
  description:
    "Claim free entries, invite friends, and follow transparent public draws. No purchase required.",
};

export const FEATURE_FLAGS = {
  ENABLE_SPONSORSHIPS:
    (process.env.ENABLE_SPONSORSHIPS ?? "true").toLowerCase() === "true",
  ENABLE_AD_CONFIG:
    (process.env.ENABLE_AD_CONFIG ?? "false").toLowerCase() === "true",
  ENABLE_REWARDED_AD_ENTRIES:
    (process.env.ENABLE_REWARDED_AD_ENTRIES ?? "false").toLowerCase() ===
    "true",
};

export const LEGAL_VERSIONS = {
  terms: "v1",
  privacy: "v1",
  drawRules: "v1",
};

export const LEGAL_DOCUMENT_PLACEHOLDER_NOTE =
  "This document is a placeholder. Final terms and regional settings must be reviewed by qualified counsel before any public launch in any jurisdiction.";

export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function stripScheme(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/.*$/, "") || "example.com";
}
