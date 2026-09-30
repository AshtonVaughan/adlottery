import { createHash, randomBytes } from "node:crypto";

/**
 * Server-side helpers. We never store raw IPs; only stable hashes
 * salted with the service role key (a per-environment secret).
 */

const SALT = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dev-only-salt";

export function sha256Hex(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  return sha256Hex(`ip:${SALT}:${ip}`);
}

export function hashDevice(userAgent: string | null | undefined): string | null {
  if (!userAgent) return null;
  return sha256Hex(`ua:${SALT}:${userAgent}`);
}

export function deterministicWinnerIndex(
  publicSeed: string,
  randomnessSource: string,
  totalEntries: number,
): number {
  if (totalEntries <= 0) {
    throw new Error("Cannot select a winner from zero entries.");
  }
  const hex = sha256Hex(`${publicSeed}|${randomnessSource}`);
  // Use the leading 52 bits of the hash. That fits safely inside a
  // JS Number, which is enough for any realistic entry count.
  const slice = hex.slice(0, 13);
  const big = BigInt("0x" + slice);
  return Number(big % BigInt(totalEntries));
}

export function seedHash(seed: string): string {
  return sha256Hex(seed);
}

export function generateSecretSeed(): string {
  return randomBytes(32).toString("hex");
}
