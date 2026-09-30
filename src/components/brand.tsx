import Link from "next/link";
import { APP_NAME } from "@/lib/config";

export function TicketGlyph({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="rgb(var(--accent))" />
      <path d="M9 11h14v3a2 2 0 0 0 0 4v3H9v-3a2 2 0 0 0 0-4z" fill="rgb(var(--accent-ink))" />
    </svg>
  );
}

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
      <TicketGlyph className="h-6 w-6" />
      {APP_NAME}
    </Link>
  );
}
