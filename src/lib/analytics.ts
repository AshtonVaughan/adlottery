/**
 * Lightweight PostHog placeholder. Only fires if NEXT_PUBLIC_POSTHOG_KEY
 * is set — otherwise it's a silent no-op. Wire up the full SDK once a
 * provider is selected.
 */

export function track(event: string, properties: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  console.debug("[analytics]", event, properties);
}
