"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/brand-mark";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { APP_NAME, APP_URL } from "@/lib/constants";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${APP_URL}/login`,
      });
      if (err) setError(err.message);
      else setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container flex max-w-sm flex-col items-center py-20">
      <Link href="/" className="flex items-center gap-2">
        <BrandMark />
        <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
      </Link>
      <Card className="mt-6 w-full">
        <CardContent className="space-y-5 p-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Reset your password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              We&apos;ll email you a secure link to set a new one.
            </p>
          </div>
          {done ? (
            <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm text-foreground">
              If an account exists for that email, the reset link is on its way.
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}
          <p className="text-center text-xs text-muted-foreground">
            <Link href="/login" className="hover:text-foreground">
              Back to log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
