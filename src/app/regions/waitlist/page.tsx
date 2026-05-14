"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SUPPORTED_COUNTRIES } from "@/lib/regions";

function WaitlistForm() {
  const params = useSearchParams();
  const cc = params.get("cc")?.toUpperCase() ?? "";
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState(cc);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          country_code: countryCode,
          source: "regions",
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Failed to join waitlist.");
      }
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to join waitlist.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <Badge variant="info">Waitlist</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          We&apos;ll let you know when {countryCode || "your region"} opens.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Leave your email. No spam, no marketing — just one note when we&apos;re live in your country.
        </p>
      </div>
      <Card>
        <CardContent className="p-6">
          {done ? (
            <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
              You&apos;re on the list. We&apos;ll email you at{" "}
              <span className="text-foreground">{email}</span> when{" "}
              {countryCode || "your region"} opens.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="country">Country</Label>
                <Select
                  id="country"
                  required
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                >
                  <option value="" disabled>
                    Choose your country
                  </option>
                  {SUPPORTED_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Joining…" : (
                  <>Join waitlist <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                <Link href="/regions" className="hover:text-foreground">
                  ← All regions
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function WaitlistPage() {
  return (
    <div className="container max-w-md py-16">
      <Suspense
        fallback={
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">Loading…</CardContent>
          </Card>
        }
      >
        <WaitlistForm />
      </Suspense>
    </div>
  );
}
