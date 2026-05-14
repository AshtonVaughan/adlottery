import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JurisdictionBadge } from "@/components/jurisdiction-badge";
import { LogoutButton } from "@/components/logout-button";
import { ReferralShare } from "@/components/referral-share";
import { requireUser } from "@/lib/auth";
import { APP_URL, LEGAL_VERSIONS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { profile } = await requireUser();
  return (
    <div className="container max-w-3xl space-y-6 py-12">
      <header className="space-y-1">
        <Badge variant="outline">Account</Badge>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Your profile
        </h1>
      </header>

      <Section title="Profile">
        <Row label="Email">{profile.email}</Row>
        <Row label="Country">{profile.country_code}</Row>
        <Row label="Region">{profile.region_code.replace(/_/g, " ")}</Row>
        <Row label="Eligibility">
          <JurisdictionBadge status={profile.eligibility_status} />
        </Row>
        <Row label="Referral code">
          <code className="font-mono text-foreground">
            {profile.referral_code}
          </code>
        </Row>
        <Row label="Member since">{formatDateTime(profile.created_at)}</Row>
      </Section>

      <Section title="Invite friends">
        <ReferralShare
          appUrl={APP_URL}
          referralCode={profile.referral_code}
        />
      </Section>

      <Section title="Legal acceptance">
        <Row label="Terms">
          v{LEGAL_VERSIONS.terms} ·{" "}
          {formatDateTime(profile.terms_accepted_at)}
        </Row>
        <Row label="Privacy">
          v{LEGAL_VERSIONS.privacy} ·{" "}
          {formatDateTime(profile.privacy_accepted_at)}
        </Row>
        <Row label="Draw rules">
          v{LEGAL_VERSIONS.drawRules} ·{" "}
          {formatDateTime(profile.draw_rules_accepted_at)}
        </Row>
        <div className="pt-2 text-xs text-muted-foreground">
          <Link href="/legal/terms" className="hover:text-foreground">Terms</Link>
          {" · "}
          <Link href="/legal/privacy" className="hover:text-foreground">Privacy</Link>
          {" · "}
          <Link href="/legal/draw-rules" className="hover:text-foreground">Draw rules</Link>
        </div>
      </Section>

      <Card className="border-destructive/25">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-destructive-foreground/80">
                Danger zone
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Deletion requests are queued for admin review. Your account
                will be deactivated immediately so no new entries can be
                claimed in your name.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form action="/api/account/delete" method="post">
              <Button variant="destructive" type="submit">
                Request account deletion
              </Button>
            </form>
            <LogoutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
        <div className="space-y-2 text-sm">{children}</div>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 border-b border-white/[0.04] pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 break-words text-foreground">{children}</span>
    </div>
  );
}
