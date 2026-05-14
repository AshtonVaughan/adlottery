import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { LEGAL_VERSIONS } from "@/lib/constants";

export default function RegionalEligibilityPage() {
  return (
    <LegalPage title="Regional Eligibility Rules" version={LEGAL_VERSIONS.terms}>
      <p>
        Eligibility differs by country. See the live{" "}
        <Link href="/regions">region availability page</Link> for the current
        status of each country including minimum age, currency, public winner
        display rules, skill-question requirements, prize caps, and permit
        thresholds.
      </p>
      <h2>Open regions</h2>
      <p>
        Open regions support direct signup and the standard draw flow.
      </p>
      <h2>Restricted regions</h2>
      <p>
        Restricted regions support signup but may require additional steps:
        skill questions, permit-bound prize thresholds, or anonymous winner
        display.
      </p>
      <h2>Waitlist regions</h2>
      <p>
        Waitlist regions cannot sign up yet. You can leave your email to be
        notified when the region opens.
      </p>
      <h2>Blocked regions</h2>
      <p>
        Blocked regions cannot participate. We may revisit availability as
        local laws or our compliance posture changes.
      </p>
    </LegalPage>
  );
}
