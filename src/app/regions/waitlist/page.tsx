"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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
        body: JSON.stringify({ email, country_code: countryCode, source: "regions" }),
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
    <Card>
      <CardHeader>
        <CardTitle>Join the waitlist</CardTitle>
      </CardHeader>
      <CardContent>
        {done ? (
          <p className="text-sm text-foreground">
            Thanks — we&apos;ll email you when {countryCode || "your region"} opens up.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
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
            <div className="space-y-1">
              <Label htmlFor="country">Country</Label>
              <Select
                id="country"
                required
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
              >
                <option value="" disabled>Choose your country</option>
                {SUPPORTED_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </Select>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Joining…" : "Join waitlist"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function WaitlistPage() {
  return (
    <div className="container max-w-md py-12">
      <Suspense
        fallback={
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Loading…
            </CardContent>
          </Card>
        }
      >
        <WaitlistForm />
      </Suspense>
    </div>
  );
}
