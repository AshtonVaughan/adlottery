import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";
import { APP_NAME } from "@/lib/constants";
import { getCurrentSession } from "@/lib/auth";

const NAV = [
  { href: "/draws", label: "Draws" },
  { href: "/archive", label: "Archive" },
  { href: "/regions", label: "Regions" },
  { href: "/legal/no-purchase-required", label: "Free entry" },
];

export async function SiteHeader() {
  const session = await getCurrentSession();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-background/70 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="group flex items-center gap-2">
          <BrandMark />
          <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-foreground/60 transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          {session ? (
            <>
              {session.profile.is_admin && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin">Admin</Link>
                </Button>
              )}
              <Button asChild variant="secondary" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
