import { LegalPage } from "@/components/legal-page";
import { APP_NAME, LEGAL_VERSIONS } from "@/lib/constants";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" version={LEGAL_VERSIONS.privacy}>
      <p>
        {APP_NAME} collects the minimum information needed to run free prize
        draws: account email, date of birth (to verify eligibility), country and
        region, acceptance timestamps for legal documents, and entries claimed.
      </p>
      <h2>What we do not collect</h2>
      <p>
        We do not store raw IP addresses. IPs are passed through a salted
        one-way hash for fraud detection only. We do not collect payment
        information from users — there is no purchase required to enter.
      </p>
      <h2>Identity verification</h2>
      <p>
        Winners may be asked to complete identity verification through a
        third-party provider before a prize is paid out. We only retain the
        verification status, not raw documents.
      </p>
      <h2>Data retention</h2>
      <p>
        Account and entry data is retained for the period required for fraud
        prevention and applicable record-keeping in your region.
      </p>
      <h2>Your rights</h2>
      <p>
        You can request access, correction, or deletion of your account data
        from the Account page or by contacting privacy support.
      </p>
    </LegalPage>
  );
}
