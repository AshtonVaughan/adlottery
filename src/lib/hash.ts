import { createHash, randomBytes } from "node:crypto";

export function sha256Hex(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

export function generateSecretSeed(): string {
  return randomBytes(32).toString("hex");
}

/**
 * winner_index = sha256(seed + "|" + randomness) mod total_entries,
 * using the leading 52 bits of the digest (exact in a JS number).
 */
export function winnerIndex(seed: string, randomness: string, totalEntries: number): number {
  if (totalEntries <= 0) throw new Error("Cannot pick a winner from zero entries.");
  const head = BigInt("0x" + sha256Hex(`${seed}|${randomness}`).slice(0, 13));
  return Number(head % BigInt(totalEntries));
}
