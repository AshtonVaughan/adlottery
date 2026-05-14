"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SUPPORTED_COUNTRIES } from "@/lib/regions";

export default function NewDrawPage() {
  const router = useRouter();
  const [title, setTitle] = useState("Weekly Free Prize Draw");
  const [drawType, setDrawType] = useState("weekly_draw");
  const [prizeAmount, setPrizeAmount] = useState("500");
  const [currency, setCurrency] = useState("USD");
  const [eligible, setEligible] = useState<string[]>(["US", "GB", "AU", "NZ"]);
  const [startsAt, setStartsAt] = useState(() =>
    new Date().toISOString().slice(0, 16),
  );
  const [endsAt, setEndsAt] = useState(() =>
    new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 16),
  );
  const [sponsorName, setSponsorName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggle(code: string) {
    setEligible((cur) =>
      cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/draws", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          draw_type: drawType,
          prize_amount: Number(prizeAmount),
          currency,
          eligible_country_codes: eligible,
          excluded_country_codes: [],
          starts_at: new Date(startsAt).toISOString(),
          ends_at: new Date(endsAt).toISOString(),
          sponsor_name: sponsorName || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to create draw.");
        return;
      }
      router.push(`/admin/draws/${json.id}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/draws"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← All draws
          </Link>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            New draw
          </h2>
          <p className="text-sm text-muted-foreground">
            Saved as a draft. Activate from the detail page when ready.
          </p>
        </div>
      </div>
      <Card>
        <CardContent className="p-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <Field label="Title" htmlFor="title">
              <Input
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Draw type" htmlFor="type">
                <Select
                  id="type"
                  value={drawType}
                  onChange={(e) => setDrawType(e.target.value)}
                >
                  <option value="weekly_draw">Weekly draw</option>
                  <option value="monthly_grand_draw">Monthly grand draw</option>
                  <option value="threshold_draw">Threshold draw</option>
                  <option value="sponsored_draw">Sponsored draw</option>
                </Select>
              </Field>
              <Field label="Currency" htmlFor="currency">
                <Input
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Prize amount" htmlFor="prize">
                <Input
                  id="prize"
                  type="number"
                  min="1"
                  value={prizeAmount}
                  onChange={(e) => setPrizeAmount(e.target.value)}
                />
              </Field>
              <Field label="Sponsor name" htmlFor="sponsor" hint="Optional">
                <Input
                  id="sponsor"
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Starts at" htmlFor="start">
                <Input
                  id="start"
                  type="datetime-local"
                  required
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </Field>
              <Field label="Ends at" htmlFor="end">
                <Input
                  id="end"
                  type="datetime-local"
                  required
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </Field>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <Label>Eligible countries</Label>
                <span className="text-[11px] text-muted-foreground">
                  {eligible.length} selected
                </span>
              </div>
              <div className="grid max-h-64 grid-cols-2 gap-1 overflow-y-auto rounded-md border border-white/[0.06] bg-white/[0.02] p-3 text-sm md:grid-cols-3">
                {SUPPORTED_COUNTRIES.map((c) => (
                  <label
                    key={c.code}
                    className="flex items-center gap-2 rounded px-1.5 py-1 hover:bg-white/[0.03]"
                  >
                    <input
                      type="checkbox"
                      checked={eligible.includes(c.code)}
                      onChange={() => toggle(c.code)}
                      className="accent-primary"
                    />
                    <span className="text-xs">
                      <span className="font-mono text-foreground/80">{c.code}</span>{" "}
                      <span className="text-muted-foreground">{c.name}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={busy}>
              {busy ? "Creating…" : "Create draft draw"}
            </Button>
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
        {hint && (
          <span className="text-[11px] text-muted-foreground">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}
