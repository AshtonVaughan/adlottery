import { APP_NAME, AD_SHARE_PERCENT, CLAIM_WINDOW_DAYS, EXCLUDED_COUNTRIES, MIN_AGE, RULES_VERSION } from "@/lib/config";
import { countryName } from "@/lib/countries";

export const metadata = { title: "Official rules" };

export default function RulesPage() {
  return (
    <article className="container max-w-2xl py-14">
      <p className="eyebrow">Version {RULES_VERSION}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Official rules</h1>
      <p className="mt-4 rounded-xl border border-ads/40 bg-ads/10 p-3 text-sm">
        Draft for legal review. Prize-promotion law varies by country; have counsel review these rules
        and the excluded-country list before launch.
      </p>

      <div className="prose-rules">
        <h2>1. No purchase necessary</h2>
        <p>
          {APP_NAME} (&ldquo;we&rdquo;) runs a free weekly prize draw. Entering is free. No purchase,
          payment, subscription, or interaction with any advertisement is required to enter or win, and
          none of these improves your chances.
        </p>

        <h2>2. Who can enter</h2>
        <ul>
          <li>You must be at least {MIN_AGE} and at least the age of majority where you live.</li>
          <li>Residents of {EXCLUDED_COUNTRIES.map(countryName).join(", ")} can&apos;t enter, nor can anyone where this draw is prohibited or restricted by law.</li>
          <li>Our staff, sponsors&apos; staff involved in the draw, and their households can&apos;t enter.</li>
          <li>One account per person. Accounts that share a person, or that are automated, are disqualified.</li>
        </ul>

        <h2>3. How to enter</h2>
        <p>
          Sign in with your email, complete your profile, and press &ldquo;Enter free today&rdquo;. You get one
          entry per calendar day (UTC) for each weekly draw, up to seven per draw.
        </p>

        <h2>4. Draw period</h2>
        <p>
          Each draw opens Monday 00:00 UTC and closes the following Monday 00:00 UTC. Entries recorded
          after closing count toward the next draw.
        </p>

        <h2>5. The prize</h2>
        <p>
          The prize is the whole pot: the sum of every item in that week&apos;s public ledger when the draw
          closes. The pot is funded by sponsor contributions, {AD_SHARE_PERCENT}% of the site&apos;s gross ad
          revenue, and rollovers of unclaimed prizes. The prize is paid in the currency shown, by bank
          transfer, PayPal or a similar method. Winners are responsible for any taxes.
        </p>

        <h2>6. How the winner is picked</h2>
        <p>
          When a draw opens we generate a secret random seed and publish its SHA-256 hash, together with
          the number of a future round of the <a href="https://drand.love" target="_blank" rel="noreferrer">drand</a>{" "}
          public randomness beacon due shortly after the draw closes. Once that round is published, all
          entries are sorted by entry time and then entry id, and the winning entry is:
        </p>
        <p><code>sha256(seed + &quot;|&quot; + drand_randomness) mod number_of_entries</code></p>
        <p>
          using the first 52 bits of the hash. We then publish the seed, the drand output, the ordered
          entry list and the result, so anyone can check the draw. Your odds depend on how many entries
          are received.
        </p>

        <h2>7. Claiming</h2>
        <ul>
          <li>We notify the winner by email and on their account page.</li>
          <li>The winner must claim within {CLAIM_WINDOW_DAYS} days and pass identity and eligibility checks.</li>
          <li>Unclaimed or disqualified prizes roll over into a future pot.</li>
          <li>The winner&apos;s chosen display name and country appear in public results.</li>
        </ul>

        <h2>8. General</h2>
        <p>
          We may disqualify entries made by fraud, automation or multiple accounts, and may cancel or
          change a draw if it can&apos;t run as planned, in which case its pot rolls over. By entering you
          accept these rules and our privacy policy.
        </p>
      </div>
    </article>
  );
}
