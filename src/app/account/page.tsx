import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JurisdictionBadge } from "@/components/jurisdiction-badge";
import { LogoutButton } from "@/components/logout-button";
import { requireUser } from "@/lib/auth";
import { ReferralShare } from "@/components/referral-share";
import { APP_URL, LEGAL_VERSIONS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { profile } = await requireUser();

  return (
    <div className="container max-w-2xl space-y-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Account</h1>

      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Email">{profile.email}</Row>
          <Row label="Country">{profile.country_code}</Row>
          <Row label="Region">{profile.region_code.replace(/_/g, " ")}</Row>
          <Row label="Eligibility"><JurisdictionBadge status={profile.eligibility_status} /></Row>
          <Row label="Referral code"><code>{profile.referral_code}</code></Row>
          <Row label="Member since">{formatDateTime(profile.created_at)}</Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Invite friends</CardTitle></CardHeader>
        <CardContent>
          <ReferralShare appUrl={APP_URL} referralCode={profile.referral_code} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Legal acceptance</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Terms">
            v{LEGAL_VERSIONS.terms} · {formatDateTime(profile.terms_accepted_at)}
          </Row>
          <Row label="Privacy">
            v{LEGAL_VERSIONS.privacy} · {formatDateTime(profile.privacy_accepted_at)}
          </Row>
          <Row label="Draw rules">
            v{LEGAL_VERSIONS.drawRules} · {formatDateTime(profile.draw_rules_accepted_at)}
          </Row>
          <div className="pt-2 text-xs text-muted-foreground">
            <Link href="/legal/terms" className="hover:text-foreground">Terms</Link>{" · "}
            <Link href="/legal/privacy" className="hover:text-foreground">Privacy</Link>{" · "}
            <Link href="/legal/draw-rules" className="hover:text-foreground">Draw rules</Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Danger zone</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Delete your account and all associated entries. Placeholder — wire
            up an admin review queue before exposing this in production.
          </p>
          <form action="/api/account/delete" method="post">
            <Button variant="destructive" type="submit">
              Request account deletion
            </Button>
          </form>
          <LogoutButton />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="col-span-2 break-words text-foreground">{children}</span>
    </div>
  );
}
