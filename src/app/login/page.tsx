"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { BASE_PATH } from "@/lib/config";

export default function LoginPage() {
  const router = useRouter();
  const { demo, session } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) router.replace("/account/");
  }, [session, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const db = supabase();
    if (!db) return;
    setBusy(true);
    setError(null);
    const { error } = await db.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}${BASE_PATH}/auth/callback/` },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="container max-w-md py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Sign in to enter</h1>
      <p className="mt-2 text-muted">We&apos;ll email you a sign-in link. No password, and it&apos;s always free.</p>
      <div className="mt-8">
        {demo ? (
          <p className="card p-4 text-sm text-muted">Sign-in is off in demo mode. Add your Supabase keys to enable it.</p>
        ) : sent ? (
          <div className="card flex gap-4 p-5">
            <MailCheck className="mt-0.5 h-6 w-6 shrink-0" />
            <div>
              <p className="font-semibold">Check your inbox</p>
              <p className="mt-1 text-sm text-muted">
                We sent a sign-in link to <span className="font-medium text-ink">{email}</span>. Open it in this browser.
              </p>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
