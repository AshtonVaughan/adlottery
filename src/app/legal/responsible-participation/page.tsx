import { LegalPage } from "@/components/legal-page";
import { APP_NAME, LEGAL_VERSIONS } from "@/lib/constants";

export default function ResponsiblePage() {
  return (
    <LegalPage title="Responsible Participation" version={LEGAL_VERSIONS.terms}>
      <p>
        {APP_NAME} is a free-to-enter promotional prize draw service. It is not
        a casino, not betting, not wagering, not a paid lottery, and not a
        crypto product. There is no payment, deposit, stake, or subscription at
        any point.
      </p>
      <h2>One account per person</h2>
      <p>
        Creating additional accounts to claim extra entries is prohibited and
        triggers fraud review.
      </p>
      <h2>Healthy participation</h2>
      <p>
        Free prize draws should be a small, enjoyable part of your week. If
        participation is starting to feel compulsive, take a break and reach
        out for support if needed.
      </p>
    </LegalPage>
  );
}
