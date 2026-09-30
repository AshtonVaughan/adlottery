import type { Contribution, PotSummary } from "@/lib/types";

const cents = (n: number) => Math.round(n * 100);

export function summarizePot(contributions: Pick<Contribution, "source" | "amount">[]): PotSummary {
  const sum = { sponsor: 0, ads: 0, rollover: 0 };
  for (const c of contributions) sum[c.source] += cents(Number(c.amount));
  return {
    sponsor: sum.sponsor / 100,
    ads: sum.ads / 100,
    rollover: sum.rollover / 100,
    total: (sum.sponsor + sum.ads + sum.rollover) / 100,
  };
}

/** Pot contribution for a given gross ad revenue, rounded down to the cent. */
export function adsContribution(grossRevenue: number, sharePercent: number): number {
  return Math.floor(cents(grossRevenue) * sharePercent / 100) / 100;
}
