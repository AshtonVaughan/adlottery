"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SUPPORTED_COUNTRIES } from "@/lib/regions";
import { APP_NAME } from "@/lib/constants";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState("");
  const [stateProv, setStateProv] = useState("");
  const [referral, setReferral] = useState("");
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [drawRules, setDrawRules] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const code = window.localStorage.getItem("referral_code");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (code) setReferral(code);
    } catch {
      // noop
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!terms || !privacy || !drawRules) {
      setError("You must accept the legal documents to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          dob,
          country_code: country,
          state_or_province: stateProv || undefined,
          referral_code: referral || undefined,
          accept_terms: true,
          accept_privacy: true,
          accept_draw_rules: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Sign-up failed.");
        if (json.redirect === "waitlist") {
          router.push(`/regions/waitlist?cc=${country}`);
        }
        return;
      }
      try {
        window.localStorage.removeItem("referral_code");
      } catch {
        /* noop */
      }
      const supabase = getSupabaseBrowserClient();
      const { error: signinError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signinError) {
        setError(
          "Account created. Please sign in to continue.",
        );
        router.push("/login");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Sign-up failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container max-w-lg py-12">
      <Card>
        <CardHeader>
          <CardTitle>Sign up for {APP_NAME}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Free to join. No purchase required.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Password (12+ characters)" htmlFor="password">
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date of birth" htmlFor="dob">
                <Input
                  id="dob"
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </Field>
              <Field label="Country" htmlFor="country">
                <Select
                  id="country"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  <option value="" disabled>Choose…</option>
                  {SUPPORTED_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="State / province (optional)" htmlFor="state">
              <Input
                id="state"
                value={stateProv}
                onChange={(e) => setStateProv(e.target.value)}
              />
            </Field>
            <Field label="Referral code (optional)" htmlFor="referral">
              <Input
                id="referral"
                value={referral}
                onChange={(e) => setReferral(e.target.value.toUpperCase())}
                maxLength={16}
              />
            </Field>

            <div className="space-y-2 rounded-lg border border-border/60 p-3 text-sm">
              <label className="flex items-start gap-2">
                <Checkbox checked={terms} onChange={(e) => setTerms(e.target.checked)} />
                <span>
                  I accept the <Link href="/legal/terms" className="text-primary hover:underline">Terms</Link>.
                </span>
              </label>
              <label className="flex items-start gap-2">
                <Checkbox checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} />
                <span>
                  I accept the <Link href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                </span>
              </label>
              <label className="flex items-start gap-2">
                <Checkbox checked={drawRules} onChange={(e) => setDrawRules(e.target.checked)} />
                <span>
                  I accept the <Link href="/legal/draw-rules" className="text-primary hover:underline">Draw Rules</Link>.
                </span>
              </label>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Creating account…" : "Create account"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Already have an account? <Link href="/login" className="text-primary hover:underline">Log in</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
