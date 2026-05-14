import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { APP_NAME, BRAND } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/[0.06]">
      <div className="container grid gap-10 py-12 md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div className="space-y-3">
          <Link href="/" className="inline-flex items-center gap-2">
            <BrandMark />
            <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
          </Link>
          <p className="max-w-xs text-sm text-muted-foreground">
            {BRAND.tagline} Free entry, transparent draws, verified winners.
          </p>
        </div>
        <FooterColumn
          title="Product"
          links={[
            { href: "/draws", label: "Active draws" },
            { href: "/archive", label: "Public archive" },
            { href: "/regions", label: "Region availability" },
            { href: "/dashboard", label: "Dashboard" },
          ]}
        />
        <FooterColumn
          title="Trust"
          links={[
            { href: "/legal/no-purchase-required", label: "No purchase required" },
            { href: "/legal/responsible-participation", label: "Responsible participation" },
            { href: "/legal/fraud-policy", label: "Fraud policy" },
            { href: "/legal/regional-eligibility", label: "Regional eligibility" },
          ]}
        />
        <FooterColumn
          title="Legal"
          links={[
            { href: "/legal/terms", label: "Terms" },
            { href: "/legal/privacy", label: "Privacy" },
            { href: "/legal/draw-rules", label: "Draw rules" },
          ]}
        />
      </div>
      <div className="border-t border-white/[0.04]">
        <div className="container flex flex-col items-start justify-between gap-2 py-5 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <p>
            Free entry only · No purchase required · Not gambling, not betting, not crypto
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <ul className="mt-3 space-y-2 text-sm text-foreground/75">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
