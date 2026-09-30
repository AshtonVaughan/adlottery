"use client";

import { useState } from "react";
import { MailCheck } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await getSupabaseBrowserClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/` },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  if (sent) {
    return (
      <div className="card flex gap-4 p-5">
        <MailCheck className="mt-0.5 h-6 w-6 shrink-0" />
        <div>
          <p className="font-semibold">Check your inbox</p>
          <p className="mt-1 text-sm text-muted">
            We sent a sign-in link to <span className="font-medium text-ink">{email}</span>. Open it on this device.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          className="field"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <button type="submit" className="btn-dark w-full" disabled={busy}>
        {busy ? "Sending…" : "Email me a sign-in link"}
      </button>
      {error && <p className="text-sm text-bad">{error}</p>}
    </form>
  );
}
