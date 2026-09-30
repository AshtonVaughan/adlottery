import { fetchDrandRandomness } from "@/lib/drand-server";
import { sendEmail } from "@/lib/email";
import { APP_URL } from "@/lib/config";
import { formatMoney } from "@/lib/utils";

/** The slice of supabase-js the job uses, so tests can pass a stub. */
export interface RpcClient {
  rpc(fn: string, args?: Record<string, unknown>): PromiseLike<{ data: unknown; error: { message: string } | null }>;
}

export interface Settings {
  excludedCountries: string[];
  adSharePercent: number;
  rulesVersion: string;
  currency: string;
  adminEmails: string[];
}

interface Prepared {
  closed: number;
  forfeited: number;
  ready: { id: string; round: number }[];
  waiting: number;
}

interface Completed {
  status: "drawn" | "rolled_over";
  amount: number;
  currency?: string;
  label?: string;
  email?: string | null;
  display_name?: string | null;
  claim_window_days?: number;
}

export interface LifecycleReport {
  closed: number;
  forfeited: number;
  waiting: number;
  results: { drawId: string; outcome: string }[];
}

interface Deps {
  now?: Date;
  fetchRandomness?: typeof fetchDrandRandomness;
  send?: typeof sendEmail;
}

async function call<T>(db: RpcClient, fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await db.rpc(fn, args);
  if (error) throw new Error(`${fn}: ${error.message}`);
  return data as T;
}

export async function syncSettings(db: RpcClient, s: Settings): Promise<void> {
  await call(db, "_sync_settings", {
    p_excluded: s.excludedCountries,
    p_ad_share: s.adSharePercent,
    p_rules_version: s.rulesVersion,
    p_currency: s.currency,
    p_admin_emails: s.adminEmails,
  });
}

/**
 * One pass of the weekly cycle. All state changes happen in the
 * database; this adds the parts SQL can't do: fetching the drand beacon
 * and emailing the winner. Safe to run as often as you like.
 */
export async function runLifecycle(db: RpcClient, deps: Deps = {}): Promise<LifecycleReport> {
  const now = deps.now ?? new Date();
  const fetchRandomness = deps.fetchRandomness ?? fetchDrandRandomness;
  const send = deps.send ?? sendEmail;

  const prep = await call<Prepared>(db, "_lifecycle_prepare", { p_now: now.toISOString() });
  const results: LifecycleReport["results"] = [];

  for (const { id, round } of prep.ready) {
    const beacon = await fetchRandomness(round);
    if (!beacon.ok) {
      results.push({ drawId: id, outcome: `error: ${beacon.reason}` });
      continue;
    }
    try {
      const done = await call<Completed>(db, "_complete_draw", {
        p_draw_id: id,
        p_randomness: beacon.randomness,
        p_now: now.toISOString(),
      });
      results.push({ drawId: id, outcome: done.status });
      if (done.status === "drawn" && done.email && done.amount > 0) {
        await send(winnerEmail(done));
      }
    } catch (err) {
      results.push({ drawId: id, outcome: `error: ${(err as Error).message}` });
    }
  }

  return { closed: prep.closed, forfeited: prep.forfeited, waiting: prep.waiting, results };
}

function winnerEmail(d: Completed) {
  const amount = formatMoney(d.amount, d.currency, true);
  return {
    to: d.email!,
    subject: `You won ${amount} in the ${d.label} draw`,
    text: [
      `Hi ${d.display_name ?? "there"},`,
      "",
      `Your entry was drawn as the winner of ${d.label}: ${amount}.`,
      `Claim it within ${d.claim_window_days} days at ${APP_URL}/account/`,
      "",
      "Unclaimed prizes roll over into a future pot.",
    ].join("\n"),
  };
}
