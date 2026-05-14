"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CountdownProps {
  to: string;
  label?: string;
  size?: "default" | "lg";
  className?: string;
}

function compute(to: string) {
  const diff = Math.max(0, new Date(to).getTime() - Date.now());
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { days, hours, minutes, seconds, diff };
}

export function Countdown({
  to,
  label = "Entry closes in",
  size = "default",
  className,
}: CountdownProps) {
  const [v, setV] = useState(() => compute(to));
  useEffect(() => {
    const t = setInterval(() => setV(compute(to)), 1000);
    return () => clearInterval(t);
  }, [to]);

  if (v.diff <= 0) {
    return (
      <div className={cn("text-xs uppercase tracking-widest text-muted-foreground", className)}>
        Entry window closed
      </div>
    );
  }

  const segmentClass = cn(
    "stat font-medium tabular-nums",
    size === "lg" ? "text-4xl" : "text-2xl",
  );
  const labelClass =
    "mt-1 block text-[10px] uppercase tracking-widest text-muted-foreground";

  return (
    <div className={className}>
      <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div
        className={cn(
          "mt-2 grid grid-cols-4 gap-3 text-center font-mono",
          size === "lg" && "gap-5",
        )}
      >
        <Segment value={v.days} label="days" segmentClass={segmentClass} labelClass={labelClass} />
        <Segment value={v.hours} label="hrs" segmentClass={segmentClass} labelClass={labelClass} pad />
        <Segment value={v.minutes} label="min" segmentClass={segmentClass} labelClass={labelClass} pad />
        <Segment value={v.seconds} label="sec" segmentClass={segmentClass} labelClass={labelClass} pad />
      </div>
    </div>
  );
}

function Segment({
  value,
  label,
  segmentClass,
  labelClass,
  pad = false,
}: {
  value: number;
  label: string;
  segmentClass: string;
  labelClass: string;
  pad?: boolean;
}) {
  return (
    <div className="rounded-md bg-white/[0.03] py-2 ring-1 ring-inset ring-white/[0.05]">
      <span className={segmentClass}>
        {pad ? value.toString().padStart(2, "0") : value}
      </span>
      <span className={labelClass}>{label}</span>
    </div>
  );
}
