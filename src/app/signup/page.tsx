import { headers } from "next/headers";
import { SUPPORTED_COUNTRIES } from "@/lib/regions";
import { SignupForm } from "./signup-form";

const SUPPORTED = new Set(SUPPORTED_COUNTRIES.map((c) => c.code));

export const dynamic = "force-dynamic";

async function getCountryHint(): Promise<string> {
  const h = await headers();
  // Common geo headers across hosts: Vercel, Cloudflare, generic CDNs.
  const candidates = [
    h.get("x-vercel-ip-country"),
    h.get("cf-ipcountry"),
    h.get("x-country-code"),
  ];
  for (const c of candidates) {
    if (c) {
      const upper = c.toUpperCase();
      if (SUPPORTED.has(upper)) return upper;
    }
  }
  return "";
}

export default async function SignupPage() {
  const hint = await getCountryHint();
  return <SignupForm countryHint={hint} />;
}
