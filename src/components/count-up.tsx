"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney } from "@/lib/utils";

/** Animates a money amount from its previous value (or 0) to `value`. */
export function CountUp({ value, currency, cents = false }: { value: number; currency: string; cents?: boolean }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    const origin = from.current;
    const duration = reduced ? 0 : 1100;
    let frame = 0;
    const tick = (now: number) => {
      const t = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      setShown(origin + (value - origin) * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className="num">{formatMoney(cents ? shown : Math.round(shown), currency, cents)}</span>;
}
