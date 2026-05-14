"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BrandMark } from "@/components/brand-mark";
import { SUPPORTED_COUNTRIES } from "@/lib/regions";
import { APP_NAME } from "@/lib/constants";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface SignupFormProps {
  countryHint?: string;
}

export function SignupForm({ countryHint = "" }: SignupFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState(countryHint);
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
      setError("You need to accept the legal documents to continue.");
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
        if (json.redirect === "waitlist") router.push(`/regions/waitlist?cc=${country}`);
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
        setError("Account created. Please sign in to continue.");
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
    <div className="container grid max-w-5xl gap-10 py-16 lg:grid-cols-[1fr_1.1fr]">
      <div className="hidden flex-col gap-8 pt-2 lg:flex">
        <Link href="/" className="inline-flex items-center gap-2">
          <BrandMark />
          <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
        </Link>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight">
          Free entries.
          <br />
          Public proof.
          <br />
          <span className="text-glow-primary">Real prizes.</span>
        </h1>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
            We never ask for payment, ever.
          </li>
          <li className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
            Eligibility is checked server-side against your region&apos;s rules.
          </li>
          <li className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
            Every draw publishes a verifiable seed and hash.
          </li>
        </ul>
        <p className="text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground hover:underline">
            Log in
          </Link>
        </p>
      </div>

      <Card>
        <CardContent className="space-y-6 p-6 md:p-8">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Create your free account
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Takes under a minute. No purchase required.
            </p>
          </div>

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
            <Field label="Password" htmlFor="password" hint="At least 12 characters.">
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
              <Field
                label="Country"
                htmlFor="country"
                hint={countryHint ? "Detected from your network" : undefined}
              >
                <Select
                  id="country"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  <option value="" disabled>
                    Choose…
                  </option>
                  {SUPPORTED_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="State / province" htmlFor="state" hint="Optional">
              <Input
                id="state"
                value={stateProv}
                onChange={(e) => setStateProv(e.target.value)}
              />
            </Field>
            <Field label="Referral code" htmlFor="referral" hint="Optional">
              <Input
                id="referral"
                value={referral}
                onChange={(e) => setReferral(e.target.value.toUpperCase())}
                maxLength={16}
              />
            </Field>

            <div className="space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-sm">
              <Accept
                checked={terms}
                onChange={setTerms}
                label={
                  <>
                    I accept the{" "}
                    <Link href="/legal/terms" className="text-foreground hover:underline">
                      Terms
                    </Link>
                    .
                  </>
                }
              />
              <Accept
                checked={privacy}
                onChange={setPrivacy}
                label={
                  <>
                    I accept the{" "}
                    <Link href="/legal/privacy" className="text-foreground hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </>
                }
              />
              <Accept
                checked={drawRules}
                onChange={setDrawRules}
                label={
                  <>
                    I accept the{" "}
                    <Link href="/legal/draw-rules" className="text-foreground hover:underline">
                      Draw Rules
                    </Link>
                    .
                  </>
                }
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Creating account…" : (
                <>Create free account <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground lg:hidden">
              Already have an account?{" "}
              <Link href="/login" className="text-foreground hover:underline">
                Log in
              </Link>
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
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Accept({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-2.5">
      <Checkbox checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-foreground/90">{label}</span>
    </label>
  );
}
