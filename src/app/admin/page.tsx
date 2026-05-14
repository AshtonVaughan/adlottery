import Link from "next/link";
import { ArrowRight, Plus, ScrollText, ShieldAlert, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function loadStats() {
  const admin = getSupabaseAdminClient();
  const [users, drawsActive, openFraud, openClaims, entriesToday] = await Promise.all([
    admin.from("profiles").select("id", { head: true, count: "exact" }),
    admin
      .from("draws")
      .select("id", { head: true, count: "exact" })
      .eq("status", "active"),
    admin
      .from("fraud_flags")
      .select("id", { head: true, count: "exact" })
      .eq("status", "open"),
    admin
      .from("winner_claims")
      .select("id", { head: true, count: "exact" })
      .in("claim_status", [
        "verification_required",
        "skill_question_required",
        "pending",
      ]),
    admin
      .from("entries")
      .select("id", { head: true, count: "exact" })
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      ),
  ]);
  return {
    users: users.count ?? 0,
    activeDraws: drawsActive.count ?? 0,
    openFraud: openFraud.count ?? 0,
    openClaims: openClaims.count ?? 0,
    entriesToday: entriesToday.count ?? 0,
  };
}

export default async function AdminOverviewPage() {
  const stats = await loadStats();
  return (
    <div className="space-y-6">
      <section className="grid gap-3 md:grid-cols-5">
        <Stat label="Users" value={stats.users} />
        <Stat label="Live draws" value={stats.activeDraws} />
        <Stat label="Entries (24h)" value={stats.entriesToday} />
        <Stat label="Open claims" value={stats.openClaims} accent="warn" />
        <Stat label="Fraud queue" value={stats.openFraud} accent="warn" />
      </section>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Quick actions
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <ActionCard
              icon={Plus}
              label="Create draw"
              href="/admin/draws/new"
              copy="Set up a draft, then activate when you're ready."
            />
            <ActionCard
              icon={Trophy}
              label="Review claims"
              href="/admin/claims"
              copy="Approve verification, mark payouts paid."
            />
            <ActionCard
              icon={ShieldAlert}
              label="Fraud queue"
              href="/admin/fraud"
              copy="Confirm or dismiss flagged accounts."
            />
            <ActionCard
              icon={ScrollText}
              label="Audit log"
              href="/admin/audit"
              copy="Every privileged action, in order."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "warn";
}) {
  return (
    <Card>
      <CardContent className="space-y-2 p-5">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p
          className={
            "stat text-3xl font-semibold " +
            (accent === "warn" && value > 0
              ? "text-amber-200"
              : "text-foreground")
          }
        >
          {value.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}

function ActionCard({
  icon: Icon,
  label,
  href,
  copy,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  copy: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-3 text-sm font-semibold tracking-tight">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{copy}</p>
      <Button asChild variant="ghost" size="sm" className="mt-3 -ml-3">
        <Link href={href}>
          Open <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );
}
