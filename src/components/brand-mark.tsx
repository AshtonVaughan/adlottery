import { cn } from "@/lib/utils";

/**
 * Compact logo mark. A rotated rounded square with a slim diagonal —
 * reads as "an entry / a ticket" without leaning on lottery iconography.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex h-7 w-7 items-center justify-center rounded-md",
        "bg-gradient-to-br from-primary/30 via-primary/10 to-transparent",
        "ring-1 ring-inset ring-primary/30",
        className,
      )}
    >
      <span className="block h-3 w-3 rotate-45 rounded-[3px] bg-primary shadow-[0_0_18px_hsl(var(--primary)/0.45)]" />
    </span>
  );
}
