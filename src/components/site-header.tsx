"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Brand } from "@/components/brand";
import { useAuth } from "@/components/auth-provider";

const LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/#fair", label: "Fairness" },
  { href: "/results/", label: "Winners" },
];

export function SiteHeader() {
  const { ready, session, me } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled ? "border-b border-line/80 bg-bg/80 backdrop-blur-md" : "border-b border-transparent"
      }`}
    >
      <div className="container flex h-16 items-center justify-between gap-4">
        <Brand />
        <nav className="flex items-center gap-1 text-sm">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hidden rounded-full px-3 py-2 text-ink/70 transition-colors hover:text-ink md:block">
              {l.label}
            </Link>
          ))}
          {me?.is_admin && (
            <Link href="/admin/" className="rounded-full px-3 py-2 text-ink/70 transition-colors hover:text-ink">
              Admin
            </Link>
          )}
          {!ready ? (
            <span className="ml-2 h-10 w-[104px]" aria-hidden="true" />
          ) : session ? (
            <Link href="/account/" className="btn-ghost ml-2 h-10 px-5">
              Your account
            </Link>
          ) : (
            <>
              <Link href="/login/" className="hidden rounded-full px-3 py-2 text-ink/70 transition-colors hover:text-ink sm:block">
                Sign in
              </Link>
              <Link href="/login/" className="btn-dark ml-1 h-10 px-5">
                Enter free
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
