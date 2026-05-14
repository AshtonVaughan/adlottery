import { LegalPage } from "@/components/legal-page";
import { APP_NAME, LEGAL_VERSIONS } from "@/lib/constants";

export default function ResponsiblePage() {
  return (
    <LegalPage
      title="Responsible Participation"
      version={LEGAL_VERSIONS.terms}
    >
      <p>
        {APP_NAME} is a free-to-enter promotional prize draw service. There
        is no payment, deposit, stake, or subscription at any point. We do
        not run any product that resembles gambling, betting, wagering, or
        casino-style mechanics.
      </p>

      <h2>Healthy participation</h2>
      <p>
        Even with a free product, healthy participation matters. A few
        guidelines we ask everyone to follow:
      </p>
      <ul>
        <li>
          Treat draws as a small, enjoyable part of your week — not a routine
          to chase.
        </li>
        <li>
          Don&apos;t create multiple accounts to claim more entries.
        </li>
        <li>
          Don&apos;t share account credentials with anyone else.
        </li>
        <li>
          If a friend or family member is showing signs of compulsive
          checking, encourage them to take a break.
        </li>
      </ul>

      <h2>If you want to take a break</h2>
      <p>
        You can request account deletion at any time from your Account page.
        Deletion requests are queued for admin review and your account is
        deactivated immediately so no new entries can be claimed.
      </p>

      <h2>External support</h2>
      <p>
        {APP_NAME} is not a gambling product, but if you would like to talk
        to someone about general digital habits or compulsive online
        behaviours, the following organisations offer support:
      </p>
      <ul>
        <li>
          United States — SAMHSA helpline: 1-800-662-HELP (4357)
        </li>
        <li>
          United Kingdom — NHS digital wellbeing resources, gov.uk &quot;Get
          help with online habits&quot;
        </li>
        <li>
          Australia — Lifeline 13 11 14, ReachOut.com
        </li>
        <li>
          Globally — your local primary-care provider or mental-health
          service
        </li>
      </ul>
      <p>
        The list above is illustrative and will be reviewed per region by
        counsel before launch.
      </p>
    </LegalPage>
  );
}
