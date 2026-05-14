import { LegalPage } from "@/components/legal-page";
import { APP_NAME, LEGAL_VERSIONS } from "@/lib/constants";

export default function NoPurchaseRequiredPage() {
  return (
    <LegalPage
      title="No Purchase Required"
      version={LEGAL_VERSIONS.drawRules}
    >
      <p>
        {APP_NAME} is a free prize draw platform. No purchase, no deposit, no
        subscription, and no payment of any kind is required to enter any
        draw, ever.
      </p>

      <h2>How prize pools are funded</h2>
      <ul>
        <li>
          <strong>Platform funding.</strong> {APP_NAME} funds the baseline
          weekly draw pool out of operating capital.
        </li>
        <li>
          <strong>Sponsors.</strong> Brands and partners may sponsor
          additional draws or contribute to existing pools.
        </li>
        <li>
          <strong>Advertising.</strong> Future ad revenue may contribute to
          the pool. Ad-watching is never required to enter a draw.
        </li>
      </ul>
      <p>
        None of these funding sources are paid by entrants.
      </p>

      <h2>How to enter without payment</h2>
      <ol>
        <li>Create a free account.</li>
        <li>Confirm your country of residence and date of birth.</li>
        <li>Accept the regional rules.</li>
        <li>Claim your daily free entry for any active draw you&apos;re eligible for.</li>
        <li>Optionally invite friends to earn referral entries.</li>
      </ol>

      <h2>If you see anything that asks for payment</h2>
      <p>
        Nothing on {APP_NAME} should ever ask you to pay to enter a draw, to
        increase entry count, or to claim a prize. If you encounter a screen
        or message that does, it is not part of the Service. Report it to
        support immediately.
      </p>

      <h2>Why this matters</h2>
      <p>
        Free entry is the core promise of the product. It defines the legal
        category we operate under in every region we&apos;re open in, and it
        protects participants from products that look similar but rely on
        payment.
      </p>
    </LegalPage>
  );
}
