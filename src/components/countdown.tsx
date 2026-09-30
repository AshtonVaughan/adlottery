"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function Countdown({ to }: { to: string }) {
  const t = parts(new Date(to).getTime() - useNow());
  const cells: [number, string][] = [
    [t.d, "days"],
    [t.h, "hours"],
    [t.m, "min"],
    [t.s, "sec"],
  ];
  return (
    <div className="grid grid-cols-4 divide-x divide-accent-ink/15" role="timer" aria-label="Time until the draw closes">
      {cells.map(([v, label]) => (
        <div key={label} className="px-1 text-center">
          <div className="num font-serif text-[40px] leading-none" suppressHydrationWarning>
            {String(v).padStart(2, "0")}
          </div>
          <div className="mt-1 text-xs opacity-60">{label}</div>
        </div>
      ))}
    </div>
  );
}

/** "4 days, 9 hours" style, for running text. */
export function TimeLeft({ to }: { to: string }) {
  const t = parts(new Date(to).getTime() - useNow());
  const text =
    t.d > 0
      ? `${t.d} ${t.d === 1 ? "day" : "days"}, ${t.h} ${t.h === 1 ? "hour" : "hours"}`
      : t.h > 0
        ? `${t.h}h ${t.m}m`
        : `${t.m}m ${t.s}s`;
  return <span suppressHydrationWarning>{text}</span>;
}
