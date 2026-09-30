import { AD_SHARE_PERCENT } from "@/lib/config";
import { formatMoney } from "@/lib/utils";
import type { PotSummary } from "@/lib/types";

const PARTS = [
  { key: "sponsor", label: "Sponsor", swatch: "bg-sponsor" },
  { key: "ads", label: `Ads (${AD_SHARE_PERCENT}% of revenue)`, swatch: "bg-ads" },
  { key: "rollover", label: "Rolled over", swatch: "bg-rollover" },
] as const;

export function PotBreakdown({ pot, currency }: { pot: PotSummary; currency: string }) {
  const parts = PARTS.filter((p) => pot[p.key] > 0);
  return (
    <div className="space-y-3">
      <div className="flex h-2.5 w-full gap-[3px] overflow-hidden rounded-full bg-line">
        {parts.map((p) => (
          <div
            key={p.key}
            className={`${p.swatch} h-full first:rounded-l-full last:rounded-r-full`}
            style={{ width: `${(pot[p.key] / pot.total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
        {(parts.length ? parts : PARTS.slice(0, 2)).map((p) => (
          <li key={p.key} className="flex items-center gap-2">
            <span className={`${p.swatch} h-2.5 w-2.5 rounded-full`} />
            <span className="text-muted">{p.label}</span>
            <span className="num font-medium">{formatMoney(pot[p.key], currency, true)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
