import { LegalPage } from "@/components/legal-page";
import { APP_NAME, LEGAL_VERSIONS } from "@/lib/constants";

export default function TermsPage() {
  return (
    <LegalPage title="Terms and Conditions" version={LEGAL_VERSIONS.terms}>
      <p>
        These terms govern your use of the {APP_NAME} platform (the &quot;Service&quot;).
        The Service offers free prize draws and does not accept payment to enter.
        No purchase is required. Eligibility, prize amounts, and draw mechanics
        vary by region and are governed by the Draw Rules and Regional
        Eligibility documents.
      </p>
      <h2>Eligibility</h2>
      <p>
        You must be at least the minimum age required by your region (default 18)
        and reside in a country that {APP_NAME} has opened for participation. You
        may not participate from blocked regions, and additional steps may be
        required in restricted regions.
      </p>
      <h2>Account integrity</h2>
      <p>
        One account per natural person. Creating multiple accounts, automating
        entries, falsifying eligibility information, or otherwise abusing the
        Service may result in entries being voided and your account banned.
      </p>
      <h2>Prizes and payouts</h2>
      <p>
        Prize pools are funded by {APP_NAME}, sponsors, or other approved
        sources. Winners may be required to complete identity verification and,
        in some regions, answer a skill question before a prize is awarded.
      </p>
      <h2>Modifications</h2>
      <p>
        {APP_NAME} may update these terms, regional rules, draw mechanics, or
        the list of supported regions at any time.
      </p>
      <h2>Contact</h2>
      <p>
        Reach us at the support email listed in the footer for any questions.
      </p>
    </LegalPage>
  );
}
