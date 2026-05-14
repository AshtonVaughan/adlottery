/**
 * Cloudflare Turnstile verification placeholder. If TURNSTILE_SECRET_KEY
 * is not set, verification is skipped (development mode). In production
 * the secret should be configured and the client should send a token.
 */

export async function verifyTurnstileToken(
  token: string | undefined,
  remoteIp?: string | null,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return { ok: true }; // dev mode
  }
  if (!token) {
    return { ok: false, reason: "Missing CAPTCHA token." };
  }
  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body },
    );
    const json = (await res.json()) as { success?: boolean };
    if (json.success) return { ok: true };
    return { ok: false, reason: "CAPTCHA verification failed." };
  } catch {
    return { ok: false, reason: "CAPTCHA verification unavailable." };
  }
}
