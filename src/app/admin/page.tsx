import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureDrawForWeek } from "@/lib/draw";
import { getDrawView } from "@/lib/data";
import { AD_SHARE_PERCENT } from "@/lib/config";
import { countryName } from "@/lib/countries";
import { weekLabel } from "@/lib/week";
import { formatMoney, formatUtc } from "@/lib/utils";
import { PotBreakdown } from "@/components/pot-breakdown";
import { BanForm, ContributionForm, LifecycleButton, SponsorForm, WinnerActions } from "./admin-forms";
import type { Winner } from "@/lib/types";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

type WinnerRow = Winner & {
  draws: { week_start: string };
  profiles: { email: string; display_name: string | null; country_code: string | null } | null;
};

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.isAdmin) redirect("/");

  const draw = await ensureDrawForWeek();
  const view = (await getDrawView(draw.id))!;
  const { data } = await getSupabaseAdminClient()
    .from("winners")
    .select("*, draws(week_start), profiles(email, display_name, country_code)")
    .order("created_at", { ascending: false })
    .limit(50);
  const winners = (data ?? []) as WinnerRow[];

  return (
    <div className="container max-w-4xl space-y-6 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{weekLabel(draw.week_start)}</h1>
          <p className="mt-1 text-sm text-muted">
            {view.entries.toLocaleString("en-US")} entries · closes {formatUtc(draw.closes_at)}
            {view.sponsor && <> · sponsor: {view.sponsor.name}</>}
          </p>
        </div>
        <LifecycleButton />
      </div>

      <section className="card p-6">
        <p className="eyebrow">Pot</p>
        <p className="num mt-2 text-4xl font-semibold tracking-tight">{formatMoney(view.pot.total, draw.currency, true)}</p>
        <div className="mt-4">
          <PotBreakdown pot={view.pot} currency={draw.currency} />
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-6">
          <h2 className="font-semibold">Add money to this pot</h2>
          <p className="mt-1 text-sm text-muted">
            For ad revenue, enter the gross amount; {AD_SHARE_PERCENT}% goes in.
          </p>
          <div className="mt-4"><ContributionForm drawId={draw.id} /></div>
        </section>
        <section className="card p-6">
          <h2 className="font-semibold">This week&apos;s sponsor</h2>
          <p className="mt-1 text-sm text-muted">Shown on the home page. Add their money separately.</p>
          <div className="mt-4"><SponsorForm drawId={draw.id} /></div>
        </section>
      </div>

      <section className="card p-6">
        <h2 className="font-semibold">Winners</h2>
        {winners.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No winners yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {winners.map((w) => (
              <li key={w.draw_id} className="grid gap-3 py-4 text-sm md:grid-cols-[1fr_auto]">
                <div className="space-y-1">
                  <p className="font-medium">
                    {weekLabel(w.draws.week_start)} · <span className="num">{formatMoney(w.amount, w.currency, true)}</span> ·{" "}
                    <span className="uppercase tracking-wide text-muted">{w.status}</span>
                  </p>
                  <p className="text-muted">
                    {w.profiles
                      ? `${w.profiles.display_name} · ${w.profiles.email} · ${countryName(w.profiles.country_code ?? "")}`
                      : "Deleted account"}
                  </p>
                  {w.legal_name && <p>Legal name: {w.legal_name}</p>}
                  {w.payout_details && <p>Pay to: {w.payout_details}</p>}
                  {w.payout_reference && <p>Reference: {w.payout_reference}</p>}
                  {w.status === "pending" && <p className="text-muted">Claim deadline {formatUtc(w.claim_deadline)}</p>}
                </div>
                <WinnerActions drawId={w.draw_id} status={w.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-6">
        <h2 className="font-semibold">Ban or unban an account</h2>
        <div className="mt-4"><BanForm /></div>
      </section>
    </div>
  );
}
