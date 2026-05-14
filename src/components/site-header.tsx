import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { getCurrentSession } from "@/lib/auth";

export async function SiteHeader() {
  const session = await getCurrentSession();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary/15 text-primary ring-1 ring-inset ring-primary/30">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-base tracking-tight">{APP_NAME}</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="/draws" className="hover:text-foreground">Active Draws</Link>
          <Link href="/archive" className="hover:text-foreground">Archive</Link>
          <Link href="/regions" className="hover:text-foreground">Regions</Link>
          <Link href="/legal/no-purchase-required" className="hover:text-foreground">No Purchase Required</Link>
        </nav>
        <div className="flex items-center gap-2">
          {session ? (
            <>
              {session.profile.is_admin && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin">Admin</Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="sm">
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
