/**
 * drand "quicknet" public randomness beacon (League of Entropy).
 * A new round is published every 3 seconds; its value cannot be known
 * before the round time. https://drand.love
 */
export const DRAND_CHAIN_HASH =
  "52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971";
export const DRAND_GENESIS_SECONDS = 1692803367;
export const DRAND_PERIOD_SECONDS = 3;

// Commit to a round this long after entries close, so the value is
// still unknown when the entry set is frozen.
export const DRAND_ROUND_DELAY_SECONDS = 60;

export const DRAND_RELAYS = [
  "https://api.drand.sh",
  "https://api2.drand.sh",
  "https://api3.drand.sh",
  "https://drand.cloudflare.com",
];

/** First round published at or after `date`. */
export function drandRoundAt(date: Date): number {
  const seconds = Math.ceil(date.getTime() / 1000);
  if (seconds <= DRAND_GENESIS_SECONDS) return 1;
  return Math.ceil((seconds - DRAND_GENESIS_SECONDS) / DRAND_PERIOD_SECONDS) + 1;
}

export function drandRoundTime(round: number): Date {
  return new Date((DRAND_GENESIS_SECONDS + (round - 1) * DRAND_PERIOD_SECONDS) * 1000);
}

export function commitmentRoundForDraw(endsAt: string, now: Date = new Date()): number {
  const base = Math.max(new Date(endsAt).getTime(), now.getTime());
  return drandRoundAt(new Date(base + DRAND_ROUND_DELAY_SECONDS * 1000));
}

export function drandRoundUrl(round: number, relay = DRAND_RELAYS[0]): string {
  return `${relay}/${DRAND_CHAIN_HASH}/public/${round}`;
}
