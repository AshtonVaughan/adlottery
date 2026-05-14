"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SUPPORTED_COUNTRIES } from "@/lib/regions";
import type { Draw } from "@/lib/types";

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function DrawEditForm({ draw }: { draw: Draw }) {
  const router = useRouter();
  const [title, setTitle] = useState(draw.title);
  const [drawType, setDrawType] = useState(draw.draw_type);
  const [prizeAmount, setPrizeAmount] = useState(String(draw.prize_amount));
  const [currency, setCurrency] = useState(draw.currency);
  const [eligible, setEligible] = useState<string[]>(draw.eligible_country_codes);
  const [startsAt, setStartsAt] = useState(toLocalInput(draw.starts_at));
  const [endsAt, setEndsAt] = useState(toLocalInput(draw.ends_at));
  const [sponsorName, setSponsorName] = useState(draw.sponsor_name ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(code: string) {
    setEligible((cur) =>
      cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code],
    );
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/draws/${draw.id}`, {
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
        setError(json.error ?? "Failed to save.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Edit draft draw</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="space-y-1">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Type</Label>
            <Select value={drawType} onChange={(e) => setDrawType(e.target.value as Draw["draw_type"])}>
              <option value="weekly_draw">Weekly draw</option>
              <option value="monthly_grand_draw">Monthly grand draw</option>
              <option value="threshold_draw">Threshold draw</option>
              <option value="sponsored_draw">Sponsored draw</option>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Currency</Label>
            <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Prize amount</Label>
            <Input type="number" min="1" value={prizeAmount} onChange={(e) => setPrizeAmount(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Sponsor (optional)</Label>
            <Input value={sponsorName} onChange={(e) => setSponsorName(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Starts at</Label>
            <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Ends at</Label>
            <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Eligible countries ({eligible.length})</Label>
          <div className="grid max-h-60 grid-cols-2 gap-1 overflow-y-auto rounded-md border border-border/60 p-3 md:grid-cols-3">
            {SUPPORTED_COUNTRIES.map((c) => (
              <label key={c.code} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={eligible.includes(c.code)}
                  onChange={() => toggle(c.code)}
                />
                {c.code} — {c.name}
              </label>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
