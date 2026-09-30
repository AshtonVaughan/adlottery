/**
 * Hourly job (GitHub Actions): opens/closes draws, draws winners from the
 * drand beacon, forfeits expired prizes, and syncs settings from the
 * repo's variables into the database.
 */
import { createClient } from "@supabase/supabase-js";
import { runLifecycle, syncSettings } from "@/lib/lifecycle";
import { AD_SHARE_PERCENT, CURRENCY, EXCLUDED_COUNTRIES, RULES_VERSION } from "@/lib/config";

async function main() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.log("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set; nothing to do.");
    return;
  }

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  await syncSettings(db, {
    excludedCountries: EXCLUDED_COUNTRIES,
    adSharePercent: AD_SHARE_PERCENT,
    rulesVersion: RULES_VERSION,
    currency: CURRENCY,
    adminEmails: (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  });

  const report = await runLifecycle(db);
  console.log(JSON.stringify(report, null, 2));

  if (report.results.some((r) => r.outcome.startsWith("error"))) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
