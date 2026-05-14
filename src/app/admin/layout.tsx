import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const tabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/draws", label: "Draws" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/claims", label: "Winner claims" },
  { href: "/admin/jurisdictions", label: "Jurisdictions" },
  { href: "/admin/sponsors", label: "Sponsors" },
  { href: "/admin/fraud", label: "Fraud" },
  { href: "/admin/audit", label: "Audit log" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="container max-w-7xl py-8">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-5">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Admin
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Operator console
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">
          All privileged actions are recorded in the audit log.
        </p>
      </header>
      <nav className="mt-4 flex flex-wrap items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm text-foreground/65 transition-colors",
              "hover:bg-white/[0.04] hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}
