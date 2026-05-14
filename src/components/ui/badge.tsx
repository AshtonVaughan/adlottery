import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        success:
          "bg-success/15 text-success-foreground ring-1 ring-inset ring-success/30",
        warning:
          "bg-yellow-500/15 text-yellow-200 ring-1 ring-inset ring-yellow-500/30",
        danger:
          "bg-destructive/15 text-destructive-foreground ring-1 ring-inset ring-destructive/30",
        info: "bg-primary/15 text-primary ring-1 ring-inset ring-primary/30",
        outline: "border border-border text-foreground",
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
