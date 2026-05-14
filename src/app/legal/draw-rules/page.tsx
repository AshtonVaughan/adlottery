import { LegalPage } from "@/components/legal-page";
import { APP_NAME, LEGAL_VERSIONS } from "@/lib/constants";

export default function DrawRulesPage() {
  return (
    <LegalPage title="Draw Rules" version={LEGAL_VERSIONS.drawRules}>
      <h2>Free entry</h2>
      <p>
        Every {APP_NAME} draw is free to enter. There is no purchase required,
        no deposit, no subscription, and no fee of any kind to participate.
      </p>
      <h2>Entry methods</h2>
      <ul>
        <li>Daily free entry — one per eligible account per draw per day.</li>
        <li>Referral bonus — awarded after a referred user claims their first valid daily entry.</li>
        <li>Promo codes — when offered.</li>
        <li>Sponsor challenges — when offered.</li>
      </ul>
      <h2>Draw method</h2>
      <p>
        Once a draw is locked, no more entries are accepted. The admin records a
        public seed and a randomness source. The winning entry is selected by
        the deterministic formula:
      </p>
      <p>
        <code>winner_index = sha256(public_seed + randomness_source) mod total_entries</code>
      </p>
      <p>
        Entries are ordered by their server-side creation time, then by entry
        id, before the winner index is applied. The seed, seed hash, and
        randomness source are published in the draw archive so anyone can
        verify the result.
      </p>
      <h2>Claiming a prize</h2>
      <p>
        Winners must complete identity verification and, in some regions, a
        skill question before payout. Prizes that are not claimed within the
        notification period may expire.
      </p>
      <h2>Region-specific rules</h2>
      <p>
        Each region has its own configuration: minimum age, allowed entry
        methods, public winner display mode, and additional eligibility steps.
        See the Regional Eligibility document for details.
      </p>
    </LegalPage>
  );
}
