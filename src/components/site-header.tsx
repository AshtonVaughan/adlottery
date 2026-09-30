"use client";

import Link from "next/link";
import { Brand } from "@/components/brand";
import { useAuth } from "@/components/auth-provider";

export function SiteHeader() {
  const { ready, session, me } = useAuth();
  return (
    <header className="border-b border-line/70">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Brand />
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <Link href="/results/" className="rounded-full px-3 py-2 text-muted hover:text-ink">
            Results
          </Link>
          <Link href="/rules/" className="hidden rounded-full px-3 py-2 text-muted hover:text-ink sm:block">
            Rules
          </Link>
          {me?.is_admin && (
            <Link href="/admin/" className="rounded-full px-3 py-2 text-muted hover:text-ink">
              Admin
            </Link>
          )}
          {!ready ? (
            <span className="h-9 w-[76px]" aria-hidden="true" />
          ) : session ? (
            <Link href="/account/" className="btn-ghost h-9 px-4">
              Account
            </Link>
          ) : (
            <Link href="/login/" className="btn-dark h-9 px-4">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
