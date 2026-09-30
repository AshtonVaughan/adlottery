import { APP_NAME } from "@/lib/config";

/** Sends via Resend when RESEND_API_KEY is set; otherwise logs and skips. */
export async function sendEmail(msg: { to: string; subject: string; text: string }): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || `${APP_NAME} <no-reply@example.com>`;
  if (!key) {
    console.info(`[email skipped: no RESEND_API_KEY] to=${msg.to} subject="${msg.subject}"`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ from, to: msg.to, subject: msg.subject, text: msg.text }),
    });
    if (!res.ok) console.error(`[email failed] ${res.status} ${await res.text()}`);
  } catch (err) {
    console.error("[email failed]", err);
  }
}
