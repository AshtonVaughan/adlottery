"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT, AD_SHARE_PERCENT } from "@/lib/config";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT || "";

/**
 * A display ad. Ads fund the pot but are never part of entering:
 * nothing about an entry depends on this component.
 */
export function AdSlot({ className = "" }: { className?: string }) {
  const pushed = useRef(false);
  const live = Boolean(ADSENSE_CLIENT && SLOT);

  useEffect(() => {
    if (!live || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ad blockers and slow loads are fine; the page works without ads.
    }
  }, [live]);

  return (
    <aside className={className} aria-label="Advertisement">
      <p className="eyebrow mb-2">Advertisement</p>
      {live ? (
        <ins
          className="adsbygoogle block"
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={SLOT}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div className="flex min-h-[140px] items-center justify-center rounded-xl border border-dashed border-line px-6 py-8 text-center text-sm text-muted">
          Ad space. {AD_SHARE_PERCENT}% of ad revenue goes into the pot.
        </div>
      )}
    </aside>
  );
}
