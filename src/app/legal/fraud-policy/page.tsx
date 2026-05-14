import { LegalPage } from "@/components/legal-page";
import { APP_NAME, LEGAL_VERSIONS } from "@/lib/constants";

export default function FraudPolicyPage() {
  return (
    <LegalPage title="Fraud and Multi-Account Policy" version={LEGAL_VERSIONS.terms}>
      <p>
        {APP_NAME} runs free prize draws. To keep them fair, we monitor for
        abuse and may suspend accounts, void entries, or refuse prize awards
        when fraud is suspected.
      </p>
      <h2>What we monitor</h2>
      <ul>
        <li>Multiple accounts from the same device or IP hash.</li>
        <li>Referral farming patterns.</li>
        <li>Unusually high claim velocity.</li>
        <li>Country mismatches between signup and activity.</li>
        <li>Repeated failed identity verification.</li>
      </ul>
      <h2>Review process</h2>
      <p>
        Fraud flags do not automatically ban accounts. They queue for admin
        review. Confirmed fraud results in account ban and voiding of all
        related entries.
      </p>
    </LegalPage>
  );
}
