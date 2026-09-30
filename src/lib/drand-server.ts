import { sha256Hex } from "@/lib/hash";
import { DRAND_RELAYS, drandRoundTime, drandRoundUrl } from "@/lib/drand";

/**
 * Fetches a round's randomness. drand defines randomness as
 * sha256(signature); we check that so a relay can't hand back an
 * arbitrary value. Full BLS signature verification is left to
 * independent verifiers using the published round number.
 */
export async function fetchDrandRandomness(
  round: number,
): Promise<{ ok: true; randomness: string } | { ok: false; reason: string }> {
  if (drandRoundTime(round).getTime() > Date.now()) {
    return {
      ok: false,
      reason: `Beacon round ${round} is not available until ${drandRoundTime(round).toISOString()}.`,
    };
  }

  for (const relay of DRAND_RELAYS) {
    try {
      const res = await fetch(drandRoundUrl(round, relay), { cache: "no-store" });
      if (!res.ok) continue;
      const body = (await res.json()) as {
        round?: number;
        randomness?: string;
        signature?: string;
      };
      if (
        body.round !== round ||
        typeof body.randomness !== "string" ||
        typeof body.signature !== "string"
      ) {
        continue;
      }
      const expected = sha256Hex(Buffer.from(body.signature, "hex"));
      if (expected !== body.randomness.toLowerCase()) continue;
      return { ok: true, randomness: body.randomness.toLowerCase() };
    } catch {
      // Try the next relay.
    }
  }
  return { ok: false, reason: `Could not fetch drand round ${round} from any relay.` };
}
