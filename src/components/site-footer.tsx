import Link from "next/link";
import { APP_NAME, BRAND } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-background">
      <div className="container grid gap-8 py-10 md:grid-cols-4">
        <div>
          <p className="text-sm font-semibold">{APP_NAME}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Free prize draws. No purchase required.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product</p>
          <ul className="mt-3 space-y-2 text-sm text-foreground/80">
            <li><Link href="/draws">Active draws</Link></li>
            <li><Link href="/archive">Public archive</Link></li>
            <li><Link href="/regions">Region availability</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Trust</p>
          <ul className="mt-3 space-y-2 text-sm text-foreground/80">
            <li><Link href="/legal/no-purchase-required">No purchase required</Link></li>
            <li><Link href="/legal/responsible-participation">Responsible participation</Link></li>
            <li><Link href="/legal/fraud-policy">Fraud &amp; multi-account policy</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Legal</p>
          <ul className="mt-3 space-y-2 text-sm text-foreground/80">
            <li><Link href="/legal/terms">Terms &amp; conditions</Link></li>
            <li><Link href="/legal/privacy">Privacy policy</Link></li>
            <li><Link href="/legal/draw-rules">Draw rules</Link></li>
            <li><Link href="/legal/regional-eligibility">Regional eligibility</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="container flex flex-col items-start justify-between gap-2 py-4 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. {BRAND.tagline}
          </p>
          <p>
            Free entry only. No purchase required. Not a casino, not gambling, not crypto.
          </p>
        </div>
      </div>
    </footer>
  );
}
