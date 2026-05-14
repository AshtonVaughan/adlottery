"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [startsAt, setStartsAt] = useState(() => new Date().toISOString().slice(0, 16));
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
    <Card>
      <CardHeader><CardTitle>New draw</CardTitle></CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="type">Type</Label>
              <Select id="type" value={drawType} onChange={(e) => setDrawType(e.target.value)}>
                <option value="weekly_draw">Weekly draw</option>
                <option value="monthly_grand_draw">Monthly grand draw</option>
                <option value="threshold_draw">Threshold draw</option>
                <option value="sponsored_draw">Sponsored draw</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="prize">Prize amount</Label>
              <Input
                id="prize"
                type="number"
                min="1"
                value={prizeAmount}
                onChange={(e) => setPrizeAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sponsor">Sponsor name (optional)</Label>
              <Input id="sponsor" value={sponsorName} onChange={(e) => setSponsorName(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="start">Starts at</Label>
              <Input id="start" type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="end">Ends at</Label>
              <Input id="end" type="datetime-local" required value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Eligible countries ({eligible.length})</Label>
            <div className="grid max-h-60 grid-cols-2 gap-1 overflow-y-auto rounded-md border border-border/60 p-3 text-sm md:grid-cols-3">
              {SUPPORTED_COUNTRIES.map((c) => (
                <label key={c.code} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={eligible.includes(c.code)}
                    onChange={() => toggle(c.code)}
                  />
                  <span>{c.code} — {c.name}</span>
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
  );
}
