const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReferralCode(length = 8): string {
  let out = "";
  const arr = new Uint32Array(length);
  // Works in node and edge runtimes
  (globalThis.crypto as Crypto).getRandomValues(arr);
  for (let i = 0; i < length; i++) {
    out += ALPHABET[arr[i] % ALPHABET.length];
  }
  return out;
}

export function isPlausibleReferralCode(code: string): boolean {
  return /^[A-Z0-9-]{4,16}$/i.test(code);
}
