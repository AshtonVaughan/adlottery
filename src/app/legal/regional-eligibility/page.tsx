import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { APP_NAME, LEGAL_VERSIONS } from "@/lib/constants";

export default function RegionalEligibilityPage() {
  return (
    <LegalPage
      title="Regional Eligibility Rules"
      version={LEGAL_VERSIONS.terms}
    >
      <p>
        Eligibility for {APP_NAME} draws differs by country. The{" "}
        <Link href="/regions" className="text-foreground hover:underline">
          live region availability page
        </Link>{" "}
        always shows the current status, minimum age, currency, winner-display
        mode, skill-question requirement, prize cap, and any permit threshold
        for each country. This document describes the categories.
      </p>

      <h2>1. Status categories</h2>
      <ul>
        <li>
          <strong>Open.</strong> Direct signup. Eligibility check confirms you
          meet the minimum age and is not blocked by other rules.
        </li>
        <li>
          <strong>Restricted.</strong> Signup allowed with additional rules.
          Examples include skill-question-based regions (Canada, India), prize
          caps (Japan), or anonymous-only winner display.
        </li>
        <li>
          <strong>Waitlist.</strong> Not currently open. You can leave your
          email and we&apos;ll notify you when the region opens.
        </li>
        <li>
          <strong>Blocked.</strong> Not available. Local law or our compliance
          posture currently prevents participation.
        </li>
      </ul>

      <h2>2. Skill-question regions</h2>
      <p>
        Some regions (for example Canada) require winners to answer a skill
        question correctly before a prize can be awarded. The question is
        issued on the winner-claim page after the draw is run. An incorrect
        answer moves the claim to <em>rejected</em>.
      </p>

      <h2>3. Prize caps</h2>
      <p>
        Some regions cap the maximum advertised prize amount. {APP_NAME} will
        not run a draw that exceeds the local cap in any region included in
        the eligible-country list.
      </p>

      <h2>4. Winner display modes</h2>
      <ul>
        <li>
          <strong>Full.</strong> Winner&apos;s name and country may be
          published.
        </li>
        <li>
          <strong>Partial.</strong> Winner identity is shown as &quot;Verified
          participant from {`{country}`}&quot;.
        </li>
        <li>
          <strong>Anonymous.</strong> No identifying information is shown — the
          public archive only confirms a verified winner exists.
        </li>
      </ul>

      <h2>5. Minimum age</h2>
      <p>
        Default minimum age is 18. Some regions configure a higher minimum.
        We never lower below 18 without explicit counsel review.
      </p>

      <h2>6. Permit thresholds</h2>
      <p>
        Some regions require a permit when the advertised prize exceeds a
        local threshold. Our operations team manages permits for these
        regions before activating qualifying draws.
      </p>

      <h2>7. Final word</h2>
      <p>
        This document is informational. It does not constitute legal advice
        for participants. Final regional configurations are reviewed by
        counsel before each region opens.
      </p>
    </LegalPage>
  );
}
