import { LegalPage } from "@/components/legal-page";
import { APP_NAME, BRAND, LEGAL_VERSIONS } from "@/lib/constants";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" version={LEGAL_VERSIONS.privacy}>
      <p>
        {APP_NAME} collects the minimum information needed to run free prize
        draws fairly and to verify winners. This policy explains what we
        collect, why, how long we keep it, and what rights you have.
      </p>

      <h2>1. What we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> email, hashed password (managed by
          Supabase Auth), date of birth, country of residence, optional
          state/province, referral code, and timestamps for legal acceptance.
        </li>
        <li>
          <strong>Activity data:</strong> entries claimed, draws viewed, and
          referral relationships.
        </li>
        <li>
          <strong>Operational hashes:</strong> a salted SHA-256 hash of your
          IP address and a salted hash of your browser user-agent string.
          These are used only for fraud detection. We do <em>not</em> store
          raw IP addresses.
        </li>
        <li>
          <strong>Winner data:</strong> identity verification status (managed
          by our third-party provider — we keep the status, not the source
          documents) and payout reference data for prize winners.
        </li>
      </ul>

      <h2>2. What we do not collect</h2>
      <ul>
        <li>We never accept payment information from entrants.</li>
        <li>We do not collect raw IP addresses or precise location data.</li>
        <li>
          We do not buy, sell, or rent personal data to third parties for
          advertising.
        </li>
      </ul>

      <h2>3. How we use your data</h2>
      <ul>
        <li>To verify eligibility (age, country, region rules) before claims.</li>
        <li>To run draws, award entries, and contact winners.</li>
        <li>To detect and respond to fraud or abuse.</li>
        <li>
          To send transactional emails (welcome, waitlist confirmation, winner
          notice, payout status). We do not send marketing email by default.
        </li>
        <li>To meet legal and regulatory requirements in your region.</li>
      </ul>

      <h2>4. Sharing</h2>
      <ul>
        <li>
          With our third-party identity-verification provider when a winner
          claim requires it.
        </li>
        <li>
          With our payout providers (Wise / Stripe) when issuing a prize
          payout.
        </li>
        <li>With law enforcement when legally compelled to do so.</li>
        <li>
          With Supabase (our database and auth provider) and Vercel (our
          hosting provider) as processors operating under data-processing
          agreements.
        </li>
      </ul>

      <h2>5. Data retention</h2>
      <p>
        Account and entry data is retained for the period required by
        applicable law in your region (typically two to seven years for
        record-keeping). Identity verification status is retained for as long
        as required by anti-fraud and tax obligations. Fraud-related signals
        are retained for the period required for investigation.
      </p>

      <h2>6. Your rights</h2>
      <p>
        Depending on your region you have the right to:
      </p>
      <ul>
        <li>Access the personal data we hold about you.</li>
        <li>Correct inaccurate data.</li>
        <li>
          Request deletion (note: deletion requests are queued for review
          alongside fraud, payout, and legal-record obligations).
        </li>
        <li>Export your data.</li>
        <li>Withdraw consent and close your account.</li>
        <li>Lodge a complaint with your local data protection authority.</li>
      </ul>
      <p>
        Submit any request to <code>{BRAND.privacyContactEmail}</code>.
      </p>

      <h2>7. Children</h2>
      <p>
        The Service is not for anyone under the regional minimum age (default
        18). We do not knowingly collect data from children. If you believe
        we have, contact us and we will delete it.
      </p>

      <h2>8. Cookies &amp; analytics</h2>
      <p>
        We use first-party session cookies set by Supabase Auth to keep you
        signed in. If we enable analytics in your region, you will see a
        banner; analytics is opt-in and we use a privacy-respecting provider
        configured to avoid cross-site tracking.
      </p>

      <h2>9. International transfers</h2>
      <p>
        Your data may be processed outside your country of residence by our
        infrastructure providers. We rely on standard contractual clauses or
        equivalent legal mechanisms where required.
      </p>

      <h2>10. Changes</h2>
      <p>
        We will publish updates to this policy as versioned documents. The
        current version is shown at the top of this page.
      </p>

      <h2>11. Contact</h2>
      <p>
        Privacy questions go to <code>{BRAND.privacyContactEmail}</code>.
        Other inquiries: <code>{BRAND.supportEmail}</code>.
      </p>
    </LegalPage>
  );
}
