import { APP_NAME } from "@/lib/config";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article className="container max-w-2xl py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy</h1>
      <p className="mt-4 rounded-xl border border-ads/40 bg-ads/10 p-3 text-sm">
        Draft for legal review. Launching globally means GDPR, UK GDPR, CCPA and others apply.
      </p>
      <div className="prose-rules">
        <h2>What we collect</h2>
        <ul>
          <li>Your email address, to sign you in and contact you if you win.</li>
          <li>Your display name and country, to check eligibility and show winners.</li>
          <li>Your entries (which draw, which day).</li>
          <li>If you win: your legal name and payout details, to verify and pay you.</li>
        </ul>
        <h2>What we don&apos;t do</h2>
        <p>We don&apos;t sell your data, and we don&apos;t share your email with sponsors.</p>
        <h2>Advertising</h2>
        <p>
          {APP_NAME} shows ads from third-party networks, which may use cookies. Where the law requires it,
          we ask for consent first. Ads are never needed to enter.
        </p>
        <h2>Deleting your account</h2>
        <p>
          Email us to delete your account. Your past entries stay in published entry lists as anonymous ids
          so that past draws remain verifiable.
        </p>
      </div>
    </article>
  );
}
