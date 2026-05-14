import { LegalPage } from "@/components/legal-page";
import { APP_NAME, LEGAL_VERSIONS } from "@/lib/constants";

export default function NoPurchaseRequiredPage() {
  return (
    <LegalPage title="No Purchase Required" version={LEGAL_VERSIONS.drawRules}>
      <p>
        {APP_NAME} is a free prize draw platform. There is no purchase
        required, no deposit, no subscription, and no payment of any kind to
        enter any draw.
      </p>
      <h2>How draws are funded</h2>
      <p>
        Prize pools are funded by the platform, by sponsors, and (later) by
        advertising revenue. None of these funding sources are paid by entrants.
      </p>
      <h2>How to enter without payment</h2>
      <ol>
        <li>Sign up for free.</li>
        <li>Confirm your country of residence and date of birth.</li>
        <li>Accept the regional rules.</li>
        <li>Claim your daily free entry.</li>
        <li>Optionally invite friends for additional bonus entries.</li>
      </ol>
    </LegalPage>
  );
}
