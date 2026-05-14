import Link from "next/link";
import { ArrowRight, Globe, Share2, Sparkles, Ticket, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JurisdictionBadge } from "@/components/jurisdiction-badge";
import { Countdown } from "@/components/countdown";
import { ClaimEntryButton } from "@/components/claim-entry-button";
import { ReferralShare } from "@/components/referral-share";
import { requireUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { canEnterDraw } from "@/lib/jurisdictions";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { APP_URL } from "@/lib/constants";
import type { Draw, Jurisdiction } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId, profile } = await requireUser();
  const admin = getSupabaseAdminClient();

  const [{ data: jurisdiction }, drawsResp, entriesResp] = await Promise.all([
    admin
      .from("jurisdictions")
      .select("*")
      .eq("country_code", profile.country_code)
      .maybeSingle<Jurisdiction>(),
    admin
      .from("draws")
      .select("*")
      .eq("status", "active")
      .order("ends_at", { ascending: true }),
    admin
      .from("entries")
      .select("id, draw_id, source, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const draws = (drawsResp.data as Draw[] | null) ?? [];
  const userEntries = entriesResp.data ?? [];

  const entryCounts = new Map<string, number>();
  for (const e of userEntries) {
    entryCounts.set(e.draw_id, (entryCounts.get(e.draw_id) ?? 0) + 1);
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: todaysClaims } = await admin
    .from("daily_entry_claims")
    .select("draw_id")
    .eq("user_id", userId)
    .eq("claim_date", today);
  const claimedToday = new Set((todaysClaims ?? []).map((r) => r.draw_id));

  const { count: referralCount } = await admin
    .from("referrals")
    .select("id", { head: true, count: "exact" })
    .eq("referrer_user_id", userId);

  const { count: rewardedReferralCount } = await admin
    .from("referrals")
    .select("id", { head: true, count: "exact" })
    .eq("referrer_user_id", userId)
    .eq("status", "rewarded");

  const drawsAvailable = draws.filter((d) =>
    canEnterDraw({
      draw: d,
      jurisdiction,
      profile,
      entrySource: "daily_free_entry",
    }).ok,
  ).length;

  return (
    <div className="container max-w-6xl space-y-10 py-10">
      <header className="space-y-3">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
          Welcome back
        </p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {profile.email}
          </h1>
          <div className="flex items-center gap-2">
            <JurisdictionBadge status={profile.eligibility_status} />
            {profile.banned_at && <Badge variant="danger">Banned</Badge>}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {profile.country_code} · {profile.region_code.replace(/_/g, " ")}
        </p>
      </header>

      {/* Stats grid */}
      <section className="grid gap-3 md:grid-cols-4">
        <StatCard icon={Ticket} label="Available draws" value={drawsAvailable} sublabel={`of ${draws.length} live`} />
        <StatCard icon={Sparkles} label="Your entries" value={userEntries.length} sublabel="across all draws" />
        <StatCard
          icon={Users}
          label="Referrals"
          value={rewardedReferralCount ?? 0}
          sublabel={`${referralCount ?? 0} total invites`}
        />
        <StatCard
          icon={Globe}
          label="Region"
          value={profile.country_code}
          sublabel={profile.region_code.replace(/_/g, " ")}
          monospaceValue
        />
      </section>

      {/* Draws */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Available draws</h2>
          <Link
            href="/draws"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            All draws →
          </Link>
        </div>

        {draws.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No active draws right now. We&apos;ll surface them here as they open.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {draws.map((d) => {
              const eligibility = canEnterDraw({
                draw: d,
                jurisdiction,
                profile,
                entrySource: "daily_free_entry",
              });
              const alreadyToday = claimedToday.has(d.id);
              const userInDraw = entryCounts.get(d.id) ?? 0;
              return (
                <Card key={d.id} className="overflow-hidden">
                  <CardContent className="space-y-5 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Badge variant={d.status === "active" ? "success" : "default"}>
                          {d.status === "active" ? "Live" : d.status}
                        </Badge>
                        <h3 className="mt-2 text-base font-semibold tracking-tight">
                          {d.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {d.draw_type.replace(/_/g, " ")}
                        </p>
                      </div>
                      <p className="stat text-2xl font-semibold text-foreground">
                        {formatCurrency(Number(d.prize_amount), d.currency)}
                      </p>
                    </div>
                    <Countdown to={d.ends_at} />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        You hold{" "}
                        <span className="text-foreground">{userInDraw}</span>{" "}
                        {userInDraw === 1 ? "entry" : "entries"}
                      </span>
                      <Link
                        href={`/draws/${d.id}`}
                        className="hover:text-foreground"
                      >
                        Draw page →
                      </Link>
                    </div>
                    {eligibility.ok ? (
                      <ClaimEntryButton
                        drawId={d.id}
                        disabled={alreadyToday}
                        disabledReason={
                          alreadyToday
                            ? "Daily entry already claimed today. Come back tomorrow."
                            : undefined
                        }
                      />
                    ) : (
                      <ClaimEntryButton
                        drawId={d.id}
                        disabled
                        disabledReason={eligibility.reason}
                      />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Two-up: referral + activity */}
      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-primary" />
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Invite friends
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              You earn a bonus entry the first time a referred friend claims a daily entry.
            </p>
            <ReferralShare
              appUrl={APP_URL}
              referralCode={profile.referral_code}
            />
            <p className="text-xs text-muted-foreground">
              Your referral code:{" "}
              <code className="font-mono text-foreground">
                {profile.referral_code}
              </code>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Recent activity
            </p>
            {userEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No entries yet. Claim your first one above.
              </p>
            ) : (
              <ul className="divide-y divide-white/[0.04] text-sm">
                {userEntries.slice(0, 8).map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-foreground/90">
                      {e.source.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(e.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="pt-1">
              <Button asChild variant="ghost" size="sm">
                <Link href="/account">
                  Account settings <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  monospaceValue = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  sublabel?: string;
  monospaceValue?: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <p
          className={`stat text-3xl font-semibold ${
            monospaceValue ? "font-mono" : ""
          }`}
        >
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {sublabel && (
          <p className="text-xs text-muted-foreground">{sublabel}</p>
        )}
      </CardContent>
    </Card>
  );
}
