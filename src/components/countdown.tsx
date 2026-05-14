"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  to: string;
  prefix?: string;
}

function compute(to: string) {
  const diff = Math.max(0, new Date(to).getTime() - Date.now());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds, diff };
}

export function Countdown({ to, prefix = "Closes in" }: CountdownProps) {
  const [v, setV] = useState(() => compute(to));
  useEffect(() => {
    const t = setInterval(() => setV(compute(to)), 1000);
    return () => clearInterval(t);
  }, [to]);

  if (v.diff <= 0) {
    return <span className="text-muted-foreground">Closed</span>;
  }

  return (
    <div className="flex flex-col gap-1 text-foreground">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        {prefix}
      </span>
      <div className="flex items-baseline gap-2 font-mono text-2xl tabular-nums">
        <span>{v.days}d</span>
        <span>{v.hours.toString().padStart(2, "0")}h</span>
        <span>{v.minutes.toString().padStart(2, "0")}m</span>
        <span>{v.seconds.toString().padStart(2, "0")}s</span>
      </div>
    </div>
  );
}
