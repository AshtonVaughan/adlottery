import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
  {
    variants: {
      variant: {
        default:
          "bg-white/[0.05] text-foreground/80 ring-1 ring-inset ring-white/[0.07]",
        success:
          "bg-primary/10 text-primary ring-1 ring-inset ring-primary/25",
        warning:
          "bg-amber-500/10 text-amber-200 ring-1 ring-inset ring-amber-500/25",
        danger:
          "bg-destructive/10 text-destructive-foreground ring-1 ring-inset ring-destructive/25",
        info:
          "bg-sky-500/10 text-sky-200 ring-1 ring-inset ring-sky-500/25",
        outline: "border border-white/10 text-foreground/70",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
