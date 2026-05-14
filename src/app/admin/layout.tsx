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
  { href: "/admin/fraud", label: "Fraud flags" },
  { href: "/admin/audit", label: "Audit logs" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="container space-y-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Admin console</h1>
        <p className="text-xs text-muted-foreground">
          Privileged actions are recorded in audit logs.
        </p>
      </header>
      <nav className="-mx-2 flex flex-wrap gap-1 border-b border-border/60 pb-2">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <div>{children}</div>
    </div>
  );
}
