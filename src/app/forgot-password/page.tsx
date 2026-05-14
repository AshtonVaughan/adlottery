"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { APP_URL } from "@/lib/constants";

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
    <div className="container max-w-sm py-12">
      <Card>
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
        </CardHeader>
        <CardContent>
          {done ? (
            <p className="text-sm">
              If an account exists for that email, we&apos;ve sent a reset link.
            </p>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
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
              <p className="text-center text-xs text-muted-foreground">
                <Link href="/login" className="hover:text-foreground">Back to log in</Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
