import Link from "next/link";
import { APP_NAME, EXCLUDED_COUNTRIES, MIN_AGE, SPONSOR_CONTACT } from "@/lib/config";
import { countryName } from "@/lib/countries";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line/70">
      <div className="container grid gap-8 py-10 text-sm text-muted md:grid-cols-[1.5fr_1fr]">
        <div className="space-y-2">
          <p className="font-medium text-ink">{APP_NAME}</p>
          <p>
            Free to enter. No purchase, payment or ad interaction is ever required. {MIN_AGE}+ only.
            One account per person. Void where prohibited.
          </p>
          <p>Not open to residents of {EXCLUDED_COUNTRIES.map(countryName).join(", ")}.</p>
        </div>
        <nav className="flex flex-wrap content-start gap-x-6 gap-y-2 md:justify-end">
          <Link href="/results/" className="hover:text-ink">Results</Link>
          <Link href="/rules/" className="hover:text-ink">Official rules</Link>
          <Link href="/privacy/" className="hover:text-ink">Privacy</Link>
          <a href={`mailto:${SPONSOR_CONTACT}`} className="hover:text-ink">Sponsor a week</a>
        </nav>
      </div>
    </footer>
  );
}
