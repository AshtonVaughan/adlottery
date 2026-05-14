import { LegalPage } from "@/components/legal-page";
import { APP_NAME, BRAND, LEGAL_VERSIONS } from "@/lib/constants";

export default function TermsPage() {
  return (
    <LegalPage title="Terms &amp; Conditions" version={LEGAL_VERSIONS.terms}>
      <p>
        These Terms govern your use of the {APP_NAME} platform (the &quot;Service&quot;)
        operated by {APP_NAME} (&quot;we&quot;, &quot;us&quot;). The Service is a free-entry
        promotional prize draw platform. It is not a casino, not betting, not
        wagering, not a paid lottery, and not a crypto product. There is no
        purchase, deposit, stake, subscription, or fee required to enter any
        draw at any time.
      </p>
      <p>
        By creating an account or claiming an entry you agree to these Terms,
        the Privacy Policy, and the Draw Rules. If you do not agree, do not
        use the Service.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You may use the Service only if you are at least the minimum age
        required by your region (default 18 years) and reside in a country
        that {APP_NAME} has opened for participation. Additional eligibility
        requirements may apply by region (for example, a skill-question
        requirement in Canada-style regions or anonymous winner display in
        regions where personal-data exposure is restricted). See the Regional
        Eligibility document and the live region availability page for the
        current status of your country.
      </p>
      <p>
        You may hold one account. Employees, contractors, and immediate-family
        members of {APP_NAME} and its sponsors are not eligible to win.
      </p>

      <h2>2. Your account</h2>
      <p>
        You are responsible for keeping your account credentials confidential
        and for activity on your account. You agree to provide accurate
        eligibility information, including country of residence and date of
        birth, and to update it if it changes. Misrepresenting eligibility,
        location, age, or identity will result in entries being voided and may
        result in account termination.
      </p>

      <h2>3. Free entries only</h2>
      <p>
        Entries are awarded only through the methods listed in the Draw Rules.
        We never accept payment, deposits, top-ups, or stakes. We will never
        ask for credit-card or banking information except for the purpose of
        paying out a prize to a verified winner.
      </p>

      <h2>4. Account integrity &amp; prohibited conduct</h2>
      <ul>
        <li>
          Creating multiple accounts, sharing accounts, or coordinating with
          others to manipulate entry counts is prohibited.
        </li>
        <li>
          Automating entries, scraping the Service, or using bots is prohibited.
        </li>
        <li>
          Submitting false eligibility data, false KYC documents, or false
          contact information is prohibited.
        </li>
        <li>
          Attempting to reverse-engineer fairness controls, draw seeds, or
          security mechanisms is prohibited.
        </li>
        <li>
          Harassing other participants, our team, or sponsors is prohibited.
        </li>
      </ul>
      <p>
        We may, at our discretion, void entries, suspend accounts, refuse
        prize awards, or pursue legal remedies in response to violations.
      </p>

      <h2>5. Prizes &amp; payouts</h2>
      <p>
        Prize pools are funded by {APP_NAME}, sponsors, or other approved
        sources. Winners are selected by the deterministic method described
        in the Draw Rules. To receive a prize, a winner must complete
        identity verification through our third-party provider and any
        regional eligibility steps (for example, a skill question). Prizes
        not claimed within the notification window may expire and be returned
        to the pool.
      </p>
      <p>
        Payout method, currency, and timing are determined per region. We
        record payout status (not-started, pending, paid, failed, cancelled)
        and a payout reference where applicable. Taxes and reporting
        obligations are the winner&apos;s responsibility unless local law
        requires otherwise.
      </p>

      <h2>6. Service availability &amp; changes</h2>
      <p>
        We may modify, suspend, or discontinue the Service, any draw, or any
        region at any time. We will publish changes to these Terms and to the
        region configurations through versioned legal documents. Continued
        use of the Service after a version bump constitutes acceptance of the
        new version.
      </p>

      <h2>7. Intellectual property</h2>
      <p>
        The Service, including its software, design, brand, and content, is
        owned by {APP_NAME} or its licensors. Nothing in these Terms grants
        you any right to use our marks or content beyond the limited purpose
        of using the Service.
      </p>

      <h2>8. Disclaimers</h2>
      <p>
        The Service is provided &quot;as is&quot; and &quot;as available&quot;.
        We do not warrant that the Service will be uninterrupted, error-free,
        or available in your region at any given time. To the maximum extent
        permitted by law, we disclaim all implied warranties, including
        merchantability, fitness for a particular purpose, and non-infringement.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, {APP_NAME} and its officers,
        employees, sponsors, and partners will not be liable for any
        indirect, incidental, special, consequential, or punitive damages
        arising out of or related to your use of the Service.
      </p>

      <h2>10. Termination</h2>
      <p>
        You may request account deletion from the Account page at any time.
        We may terminate or suspend your account if you violate these Terms.
        Termination does not affect entries already voided or actions already
        recorded in the audit log.
      </p>

      <h2>11. Governing law &amp; disputes</h2>
      <p>
        These Terms are governed by the laws of the jurisdiction in which
        {" "}{APP_NAME} is established, except where local law applies. Counsel
        will set the final governing-law clause and dispute-resolution path
        (mediation, arbitration, or courts) per region before public launch.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions about these Terms can be sent to{" "}
        <code>{BRAND.legalContactEmail}</code>. Privacy questions go to{" "}
        <code>{BRAND.privacyContactEmail}</code>. General support is at{" "}
        <code>{BRAND.supportEmail}</code>.
      </p>
    </LegalPage>
  );
}
