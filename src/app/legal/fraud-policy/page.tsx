import { LegalPage } from "@/components/legal-page";
import { APP_NAME, LEGAL_VERSIONS } from "@/lib/constants";

export default function FraudPolicyPage() {
  return (
    <LegalPage
      title="Fraud &amp; Multi-Account Policy"
      version={LEGAL_VERSIONS.terms}
    >
      <p>
        {APP_NAME} runs free prize draws and treats fairness as the core
        product. To keep draws fair, we actively monitor for abuse and may
        void entries, refuse prize awards, or suspend accounts where fraud
        is confirmed.
      </p>

      <h2>1. What we watch for</h2>
      <ul>
        <li>
          Multiple accounts originating from the same device hash or salted
          IP-hash signature within short windows.
        </li>
        <li>
          Referral farming patterns — bursts of signups using a single
          referrer&apos;s code with no organic activity afterwards.
        </li>
        <li>
          Unusually high claim velocity relative to legitimate user
          behaviour.
        </li>
        <li>
          Country mismatches between signup country and ongoing activity
          location.
        </li>
        <li>
          Repeated failed identity verification or mismatched personal data.
        </li>
        <li>
          Use of disposable email providers in combination with other risk
          signals.
        </li>
        <li>Automation (scripted entries, bot traffic, headless browsers).</li>
      </ul>

      <h2>2. Review process</h2>
      <p>
        Fraud flags do <strong>not</strong> automatically ban accounts. Each
        flag is queued in the admin review console with the underlying
        signal recorded and is reviewed by a human before any account
        action. The outcomes are:
      </p>
      <ul>
        <li>
          <strong>Dismissed</strong> — no further action; the flag stays on
          record for pattern detection.
        </li>
        <li>
          <strong>Confirmed</strong> — the account is banned, entries are
          voided, and any pending prize award is cancelled. The action is
          recorded in the audit log.
        </li>
      </ul>

      <h2>3. Appeals</h2>
      <p>
        If you believe an action against your account was a mistake, contact
        support. We will review the flag, the audit log, and any evidence
        you provide. Where appropriate we restore the account and reinstate
        voided entries.
      </p>

      <h2>4. What you can do to keep your account safe</h2>
      <ul>
        <li>
          Use a unique, strong password (12+ characters). Don&apos;t reuse it
          on other sites.
        </li>
        <li>
          Don&apos;t share your account or referral code with anyone you
          wouldn&apos;t share your email with.
        </li>
        <li>
          If you change country, update the country on your profile so
          eligibility checks remain accurate.
        </li>
        <li>
          Report suspicious draws, suspicious promo codes, or anything that
          asks for payment.
        </li>
      </ul>

      <h2>5. Data we use</h2>
      <p>
        For fraud detection we store only salted SHA-256 hashes of IP and
        user-agent strings, plus your account activity (entries, referrals,
        verification status). Raw IP addresses are never stored. See the
        Privacy Policy for details.
      </p>
    </LegalPage>
  );
}
