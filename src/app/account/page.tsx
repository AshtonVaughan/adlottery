import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { ensureDrawForWeek } from "@/lib/draw";
import { getUserDrawStatus, getUserWinnings } from "@/lib/data";
import { profileComplete } from "@/lib/eligibility";
import { countryName, isCountryCode } from "@/lib/countries";
import { weekLabel } from "@/lib/week";
import { formatMoney, formatUtc } from "@/lib/utils";
import { ProfileForm } from "./profile-form";
import { ClaimForm } from "./claim-form";
import type { WinnerStatus } from "@/lib/types";

export const metadata = { title: "Your account" };
export const dynamic = "force-dynamic";

const STATUS_TEXT: Record<WinnerStatus, string> = {
  pending: "Waiting for your claim",
  claimed: "Claim received, verifying",
  verified: "Verified, payment on its way",
  paid: "Paid",
  forfeited: "Expired, rolled into a later pot",
};

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const { profile } = session;

  if (!profileComplete(profile)) {
    const geo = (await headers()).get("x-vercel-ip-country")?.toUpperCase() ?? "";
    return (
      <div className="container max-w-lg py-14">
        <p className="eyebrow">Almost there</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Finish signing up</h1>
        <p className="mt-2 text-muted">We need this once so we can pay you if you win.</p>
        <div className="mt-8">
          <ProfileForm
            defaultName={profile.display_name ?? ""}
            defaultCountry={profile.country_code ?? (isCountryCode(geo) ? geo : "")}
            countryLocked={Boolean(profile.country_code)}
          />
        </div>
      </div>
    );
  }

  const draw = await ensureDrawForWeek();
  const [status, winnings] = await Promise.all([
    getUserDrawStatus(session.userId, draw.id),
    getUserWinnings(session.userId),
  ]);
  const toClaim = winnings.filter((w) => w.status === "pending" && new Date(w.claim_deadline) > new Date());

  return (
    <div className="container max-w-2xl space-y-8 py-14">
      <div>
        <p className="eyebrow">Your account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Hi, {profile.display_name}</h1>
        <p className="mt-1 text-sm text-muted">
          {session.email} · {countryName(profile.country_code!)}
        </p>
      </div>

      {toClaim.map((w) => (
        <div key={w.draw_id} className="ticket rounded-2xl bg-accent p-6 text-accent-ink sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em]">You won · {weekLabel(w.week_start)}</p>
          <p className="num mt-2 text-5xl font-semibold tracking-tight">{formatMoney(w.amount, w.currency, true)}</p>
          <p className="mt-2 text-sm opacity-70">Claim by {formatUtc(w.claim_deadline)}.</p>
          <div className="mt-6">
            <ClaimForm drawId={w.draw_id} />
          </div>
        </div>
      ))}

      <div className="card p-6">
        <p className="eyebrow">{weekLabel(draw.week_start)}</p>
        <p className="mt-2 text-xl font-semibold">
          <span className="num">{status.entriesThisDraw}</span> of 7 possible entries this week
        </p>
        <div className="mt-4 flex gap-1.5" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} className={`h-2 flex-1 rounded-full ${i < status.entriesThisDraw ? "bg-accent" : "bg-line"}`} />
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">
          {status.enteredToday ? "You've entered today. Come back tomorrow for another." : "You haven't entered today."}{" "}
          <Link href="/" className="font-medium text-ink underline underline-offset-4">
            {status.enteredToday ? "See the pot" : "Enter now"}
          </Link>
        </p>
      </div>

      {winnings.length > 0 && (
        <div className="card p-6">
          <p className="eyebrow">Your prizes</p>
          <ul className="mt-3 divide-y divide-line">
            {winnings.map((w) => (
              <li key={w.draw_id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <span>{weekLabel(w.week_start)}</span>
                <span className="text-muted">{STATUS_TEXT[w.status]}</span>
                <span className="num font-semibold">{formatMoney(w.amount, w.currency, true)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form action="/auth/signout" method="post">
        <button className="btn-ghost">Sign out</button>
      </form>
    </div>
  );
}
