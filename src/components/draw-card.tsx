import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/countdown";
import { formatCurrency } from "@/lib/utils";
import type { Draw } from "@/lib/types";

interface DrawCardProps {
  draw: Draw;
  totalEntries?: number;
  userEntries?: number;
  showCta?: boolean;
}

export function DrawCard({
  draw,
  totalEntries = 0,
  userEntries,
  showCta = true,
}: DrawCardProps) {
  return (
    <Card className="gradient-border">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>{draw.title}</CardTitle>
          <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
            {draw.draw_type.replace(/_/g, " ")}
          </p>
        </div>
        <Badge variant={draw.status === "active" ? "success" : "default"}>
          {draw.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Prize pool
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">
              {formatCurrency(Number(draw.prize_amount), draw.currency)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Sponsor / platform-funded · No purchase required
            </p>
          </div>
          <div className="flex flex-col items-start gap-2">
            <Countdown to={draw.ends_at} />
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>Entries: <span className="text-foreground">{totalEntries.toLocaleString()}</span></span>
              {typeof userEntries === "number" && (
                <span>You: <span className="text-foreground">{userEntries}</span></span>
              )}
            </div>
          </div>
        </div>
        {showCta && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button asChild>
              <Link href={`/draws/${draw.id}`}>View draw</Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              Free entry · Transparent public draw
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
