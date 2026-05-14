import { LegalPage } from "@/components/legal-page";
import { APP_NAME, LEGAL_VERSIONS } from "@/lib/constants";

export default function DrawRulesPage() {
  return (
    <LegalPage title="Draw Rules" version={LEGAL_VERSIONS.drawRules}>
      <p>
        These Draw Rules describe how every {APP_NAME} draw works — how
        entries are issued, how the winner is selected, and how the result is
        verified.
      </p>

      <h2>1. Free entry</h2>
      <p>
        Every {APP_NAME} draw is free to enter. There is no purchase
        required, no deposit, no subscription, and no fee at any point. If a
        screen ever asks you for payment in order to enter a draw, it is not
        part of the {APP_NAME} Service — report it immediately.
      </p>

      <h2>2. Entry methods</h2>
      <ul>
        <li>
          <strong>Daily free entry:</strong> one entry per eligible account per
          draw per UTC day, claimed manually from the dashboard or draw page.
        </li>
        <li>
          <strong>Referral bonus:</strong> when a referred user signs up and
          claims their first valid daily entry, the referrer is awarded one
          bonus entry into the same draw (subject to the referrer being
          eligible).
        </li>
        <li>
          <strong>Promo codes:</strong> issued by us occasionally. Each code
          has its own eligible countries, bonus-entry amount, and expiry.
        </li>
        <li>
          <strong>Sponsor challenges:</strong> brand-led prompts (e.g. a
          public challenge or simple action) that grant a bonus entry. Free
          alternative methods are always available where required.
        </li>
      </ul>
      <p>
        Allowed entry methods vary by region. See the Regional Eligibility
        document and the live region availability page for your country.
      </p>

      <h2>3. Eligibility</h2>
      <p>
        You must be eligible for a draw at the moment of entry. Eligibility
        depends on your country&apos;s jurisdiction configuration:
      </p>
      <ul>
        <li>
          <strong>Open:</strong> direct participation.
        </li>
        <li>
          <strong>Restricted:</strong> participation allowed with extra
          eligibility steps (e.g. a skill question, anonymous winner display,
          permit-bound prize threshold).
        </li>
        <li>
          <strong>Waitlist:</strong> participation not yet open. You can
          register interest.
        </li>
        <li>
          <strong>Blocked:</strong> participation not available in your
          country.
        </li>
      </ul>
      <p>
        Each draw also lists eligible and excluded country codes that take
        precedence over the global region status.
      </p>

      <h2>4. Draw lifecycle</h2>
      <ol>
        <li>
          <strong>Draft</strong> — being prepared by the operations team.
        </li>
        <li>
          <strong>Active</strong> — entries are open.
        </li>
        <li>
          <strong>Locked</strong> — entry window closed; no more entries
          accepted.
        </li>
        <li>
          <strong>Drawn</strong> — the winner has been selected
          deterministically and recorded.
        </li>
        <li>
          <strong>Published</strong> — the result is visible in the public
          archive with the full fairness proof.
        </li>
      </ol>

      <h2>5. Winner selection method</h2>
      <p>
        Once a draw is locked we record a <em>public seed</em> (for example a
        future scheduled headline or a public message we publish in advance)
        and a <em>randomness source</em> (for example a future Bitcoin block
        hash or a randomness-beacon round) that we cannot manipulate after
        the fact. We then sort all valid entries by{" "}
        <code>created_at</code> then by entry id and compute:
      </p>
      <pre><code>winner_index = sha256(public_seed + randomness_source) mod total_entries</code></pre>
      <p>
        We publish the seed, its SHA-256 hash, the randomness source, the
        total entry count, and a partial mask of the winning entry id in the
        public archive. Anyone can re-run the math and verify the result.
      </p>

      <h2>6. Reruns &amp; cancellations</h2>
      <p>
        Once a draw is drawn we do not silently rerun it. If a draw must be
        cancelled (for example because a regulatory issue is identified
        before publication) the cancellation requires an admin note and is
        recorded in the public audit log.
      </p>

      <h2>7. Claiming a prize</h2>
      <p>
        Winners are notified by email and through the in-app winner-claim
        page. To receive the prize:
      </p>
      <ul>
        <li>
          Complete identity verification through our third-party provider.
        </li>
        <li>
          If your region requires a skill question, answer it correctly. An
          incorrect answer moves the claim to <em>rejected</em>.
        </li>
        <li>
          Provide payout details when our team requests them. We never ask
          you to pay anything in order to receive a prize.
        </li>
      </ul>
      <p>
        Prizes not claimed within the notification window may expire.
      </p>

      <h2>8. Tax and reporting</h2>
      <p>
        Tax treatment and reporting obligations on prizes vary by region.
        Where local law requires us to issue tax forms or withhold tax we
        will do so; otherwise responsibility for declaring the prize rests
        with the winner. We strongly recommend consulting a local tax
        professional.
      </p>

      <h2>9. Voiding entries</h2>
      <p>
        We may void entries that:
      </p>
      <ul>
        <li>were claimed in violation of these Draw Rules or the Terms;</li>
        <li>originate from accounts where fraud has been confirmed;</li>
        <li>were created during an outage that has been rolled back;</li>
        <li>relied on a promo code that was issued in error.</li>
      </ul>
      <p>Voiding is recorded in the audit log.</p>

      <h2>10. Changes</h2>
      <p>
        These Draw Rules are versioned. The version applicable to your entry
        is the one in force at the moment of entry. The current version is
        shown at the top of this page.
      </p>
    </LegalPage>
  );
}
