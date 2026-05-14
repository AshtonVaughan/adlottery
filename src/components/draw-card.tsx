import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/countdown";
import { formatCurrency } from "@/lib/utils";
import type { Draw } from "@/lib/types";

interface DrawCardProps {
  draw: Draw;
  totalEntries?: number;
  userEntries?: number;
  href?: string;
  focal?: boolean;
}

export function DrawCard({
  draw,
  totalEntries = 0,
  userEntries,
  href,
  focal = false,
}: DrawCardProps) {
  const linkTarget = href ?? `/draws/${draw.id}`;
  return (
    <Card
      className={
        focal
          ? "relative overflow-hidden bg-focal shadow-focal"
          : "relative overflow-hidden"
      }
    >
      {focal && (
        <div
          className="pointer-events-none absolute inset-0 bg-dot-grid opacity-50"
          aria-hidden
        />
      )}
      <div className="relative space-y-6 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <Badge variant={draw.status === "active" ? "success" : "default"}>
              {draw.status === "active" ? "Live" : draw.status}
            </Badge>
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              {draw.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {readableType(draw.draw_type)} · {draw.eligible_country_codes.length}{" "}
              countries
            </p>
          </div>
          <Link
            href={linkTarget}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
            aria-label="View draw"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Prize pool
            </p>
            <p
              className={
                focal
                  ? "stat mt-1 text-5xl font-semibold text-glow-primary md:text-6xl"
                  : "stat mt-1 text-4xl font-semibold text-foreground"
              }
            >
              {formatCurrency(Number(draw.prize_amount), draw.currency)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Funded by the platform &amp; sponsors · No purchase required
            </p>
          </div>
          <div className="space-y-3">
            {draw.status === "active" ? (
              <Countdown to={draw.ends_at} size={focal ? "lg" : "default"} />
            ) : (
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {draw.status}
              </p>
            )}
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>
                Entries:{" "}
                <span className="text-foreground">
                  {totalEntries.toLocaleString()}
                </span>
              </span>
              {typeof userEntries === "number" && (
                <span>
                  You:{" "}
                  <span className="text-foreground">{userEntries}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function readableType(t: Draw["draw_type"]): string {
  switch (t) {
    case "weekly_draw":
      return "Weekly draw";
    case "monthly_grand_draw":
      return "Monthly grand draw";
    case "threshold_draw":
      return "Threshold draw";
    case "sponsored_draw":
      return "Sponsored draw";
  }
}
