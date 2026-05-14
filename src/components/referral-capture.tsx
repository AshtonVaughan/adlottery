"use client";

import { useEffect } from "react";

/**
 * Reads ?ref= from the URL on mount and stores it in localStorage so that
 * the signup form can pick it up later. Safe to mount on every page.
 */
export function ReferralCapture() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const ref = url.searchParams.get("ref");
      if (ref && /^[A-Z0-9-]{4,16}$/i.test(ref)) {
        window.localStorage.setItem("referral_code", ref.toUpperCase());
      }
    } catch {
      // noop
    }
  }, []);
  return null;
}
