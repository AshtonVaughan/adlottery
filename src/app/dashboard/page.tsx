import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JurisdictionBadge } from "@/components/jurisdiction-badge";
import { Countdown } from "@/components/countdown";
import { ClaimEntryButton } from "@/components/claim-entry-button";
import { ReferralShare } from "@/components/referral-share";
import { requireUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { canEnterDraw } from "@/lib/jurisdictions";
import { formatCurrency } from "@/lib/utils";
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

  return (
    <div className="container space-y-8 py-10">
      <header className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Welcome back
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            {profile.email}
          </h1>
          <JurisdictionBadge status={profile.eligibility_status} />
          {profile.banned_at && <Badge variant="danger">Banned</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          {profile.country_code} · {profile.region_code.replace(/_/g, " ")}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Active draws</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{draws.length}</p>
            <p className="text-xs text-muted-foreground">In your region today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Your entries</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{userEntries.length}</p>
            <p className="text-xs text-muted-foreground">Across all active draws</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Referrals</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{rewardedReferralCount ?? 0}<span className="ml-1 text-base text-muted-foreground">/ {referralCount ?? 0}</span></p>
            <p className="text-xs text-muted-foreground">Rewarded / total</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Available draws</h2>
        {draws.length === 0 && (
          <Card><CardContent className="p-6 text-sm text-muted-foreground">
            No active draws right now. Check back soon.
          </CardContent></Card>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {draws.map((d) => {
            const eligibility = canEnterDraw({
              draw: d,
              jurisdiction,
              profile,
              entrySource: "daily_free_entry",
            });
            const alreadyToday = claimedToday.has(d.id);
            return (
              <Card key={d.id}>
                <CardHeader>
                  <CardTitle>{d.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-baseline gap-4">
                    <span className="text-2xl font-semibold tracking-tight">
                      {formatCurrency(Number(d.prize_amount), d.currency)}
                    </span>
                    <Badge variant="info">{d.draw_type.replace(/_/g, " ")}</Badge>
                  </div>
                  <Countdown to={d.ends_at} />
                  <p className="text-xs text-muted-foreground">
                    Your entries here: <span className="text-foreground">{entryCounts.get(d.id) ?? 0}</span>
                  </p>
                  {eligibility.ok ? (
                    <ClaimEntryButton
                      drawId={d.id}
                      disabled={alreadyToday}
                      disabledReason={alreadyToday ? "Daily entry already claimed today." : undefined}
                    />
                  ) : (
                    <ClaimEntryButton
                      drawId={d.id}
                      disabled
                      disabledReason={eligibility.reason}
                    />
                  )}
                  <Link
                    href={`/draws/${d.id}`}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    View draw page →
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Invite friends</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Bonus entries for each friend who signs up and claims their first valid daily entry.
            </p>
            <ReferralShare appUrl={APP_URL} referralCode={profile.referral_code} />
            <p className="text-xs text-muted-foreground">
              Your code: <code>{profile.referral_code}</code>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {userEntries.length === 0 ? (
              <p className="text-muted-foreground">No entries yet.</p>
            ) : (
              userEntries.slice(0, 8).map((e) => (
                <div key={e.id} className="flex items-center justify-between text-xs">
                  <span>{e.source.replace(/_/g, " ")}</span>
                  <span className="text-muted-foreground">
                    {new Date(e.created_at).toLocaleString()}
                  </span>
                </div>
              ))
            )}
            <div className="pt-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/account">Account settings</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
