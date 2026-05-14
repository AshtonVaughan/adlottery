import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JurisdictionBadge } from "@/components/jurisdiction-badge";
import { APP_NAME } from "@/lib/constants";
import type { Jurisdiction } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_ORDER = ["open", "restricted", "waitlist", "blocked"] as const;

async function loadJurisdictions(): Promise<Jurisdiction[]> {
  try {
    const admin = getSupabaseAdminClient();
    const { data } = await admin
      .from("jurisdictions")
      .select("*")
      .order("display_name", { ascending: true });
    return (data as Jurisdiction[]) ?? [];
  } catch {
    return [];
  }
}

export default async function RegionsPage() {
  const jurisdictions = await loadJurisdictions();
  const grouped = new Map<string, Jurisdiction[]>();
  for (const j of jurisdictions) {
    grouped.set(j.status, [...(grouped.get(j.status) ?? []), j]);
  }

  return (
    <div className="container max-w-6xl py-16">
      <div className="max-w-2xl">
        <Badge variant="outline">Region availability</Badge>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          Where {APP_NAME} is open today.
        </h1>
        <p className="mt-3 text-muted-foreground">
          We launch country-by-country. Open regions can sign up immediately;
          restricted regions require extra eligibility steps; waitlisted
          regions can leave their email; blocked regions cannot participate
          today.
        </p>
      </div>

      <div className="mt-10 space-y-12">
        {STATUS_ORDER.map((status) => {
          const items = grouped.get(status) ?? [];
          if (items.length === 0) return null;
          return (
            <section key={status}>
              <div className="mb-4 flex items-baseline justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-3">
                  <JurisdictionBadge status={status} />
                  <h2 className="text-lg font-medium text-foreground/90">
                    {STATUS_HEADLINES[status]}
                  </h2>
                </div>
                <span className="text-xs text-muted-foreground">
                  {items.length} {items.length === 1 ? "country" : "countries"}
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {items.map((j) => (
                  <article
                    key={j.id}
                    className="group rounded-lg border border-white/[0.06] bg-card p-5 transition-colors hover:border-white/[0.12]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold tracking-tight">
                          {j.display_name}
                        </p>
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">
                          {j.country_code} · {j.currency}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {j.region_code.replace(/_/g, " ")}
                      </span>
                    </div>
                    <dl className="mt-4 space-y-1 text-xs text-muted-foreground">
                      <RuleRow label="Min age">{j.min_age}+</RuleRow>
                      {j.requires_skill_question && (
                        <RuleRow label="Skill question">required</RuleRow>
                      )}
                      {j.prize_cap_amount && (
                        <RuleRow label="Prize cap">
                          {j.prize_cap_amount.toLocaleString()} {j.currency}
                        </RuleRow>
                      )}
                      {j.requires_permit_above_amount && (
                        <RuleRow label="Permit above">
                          {j.requires_permit_above_amount.toLocaleString()}{" "}
                          {j.currency}
                        </RuleRow>
                      )}
                      <RuleRow label="Winner display">
                        {j.public_winner_display_mode}
                      </RuleRow>
                    </dl>
                    <div className="mt-5">
                      {j.status === "blocked" ? (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Link href={`/regions/waitlist?cc=${j.country_code}`}>
                            Join the waitlist <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="w-full"
                        >
                          <Link href="/signup">Sign up</Link>
                        </Button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
        {jurisdictions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No jurisdictions configured yet.
          </p>
        )}
      </div>
    </div>
  );
}

const STATUS_HEADLINES: Record<Jurisdiction["status"], string> = {
  open: "Open today",
  restricted: "Open with additional eligibility steps",
  waitlist: "Waitlist — leave your email",
  blocked: "Not available today",
};

function RuleRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="text-foreground/90">{children}</span>
    </div>
  );
}
