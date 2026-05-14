/**
 * Placeholder in-memory rate limiter for sensitive actions.
 * Replace with Upstash, KV, or Supabase-side counters before
 * any meaningful traffic. Per-process, per-runtime — best-effort only.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetIn: windowMs };
  }
  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: existing.resetAt - now,
    };
  }
  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetIn: existing.resetAt - now,
  };
}
