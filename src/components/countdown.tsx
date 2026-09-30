"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

export function Countdown({ to }: { to: string }) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const t = parts(target - now);
  const cells: [number, string][] = [
    [t.d, "days"],
    [t.h, "hrs"],
    [t.m, "min"],
    [t.s, "sec"],
  ];
  return (
    <div className="grid grid-cols-4 gap-2" role="timer" aria-label="Time until the draw closes">
      {cells.map(([v, label]) => (
        <div key={label} className="rounded-xl bg-accent-ink/[0.07] px-2 py-2.5 text-center">
          <div className="num text-2xl font-semibold tracking-tight" suppressHydrationWarning>
            {String(v).padStart(2, "0")}
          </div>
          <div className="text-[11px] font-medium uppercase tracking-wider opacity-60">{label}</div>
        </div>
      ))}
    </div>
  );
}
