"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Jurisdiction } from "@/lib/types";

interface Props {
  jurisdiction: Jurisdiction;
}

const STATUSES = ["open", "restricted", "waitlist", "blocked"] as const;
const DISPLAY = ["full", "partial", "anonymous"] as const;
const ENTRY_METHODS = [
  "daily_free_entry",
  "referral_bonus",
  "promo_code",
  "manual_adjustment",
  "sponsor_challenge",
];

export function JurisdictionForm({ jurisdiction }: Props) {
  const router = useRouter();
  const [j, setJ] = useState<Jurisdiction>(jurisdiction);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleMethod(field: "allowed_entry_methods" | "blocked_entry_methods", m: string) {
    setJ((cur) => {
      const list = cur[field];
      return {
        ...cur,
        [field]: list.includes(m) ? list.filter((x) => x !== m) : [...list, m],
      };
    });
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/jurisdictions/${j.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: j.status,
          min_age: j.min_age,
          currency: j.currency,
          requires_skill_question: j.requires_skill_question,
          requires_permit_above_amount: j.requires_permit_above_amount,
          prize_cap_amount: j.prize_cap_amount,
          kyc_required_before_payout: j.kyc_required_before_payout,
          public_winner_display_mode: j.public_winner_display_mode,
          allowed_entry_methods: j.allowed_entry_methods,
          blocked_entry_methods: j.blocked_entry_methods,
          notes: j.notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Save failed.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={j.status} onChange={(e) => setJ({ ...j, status: e.target.value as Jurisdiction["status"] })}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Min age</Label>
          <Input
            type="number"
            min={13}
            max={99}
            value={j.min_age}
            onChange={(e) => setJ({ ...j, min_age: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1">
          <Label>Currency</Label>
          <Input value={j.currency} onChange={(e) => setJ({ ...j, currency: e.target.value.toUpperCase() })} />
        </div>
        <div className="space-y-1">
          <Label>Winner display</Label>
          <Select value={j.public_winner_display_mode} onChange={(e) => setJ({ ...j, public_winner_display_mode: e.target.value as Jurisdiction["public_winner_display_mode"] })}>
            {DISPLAY.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Permit threshold</Label>
          <Input
            type="number"
            value={j.requires_permit_above_amount ?? ""}
            onChange={(e) => setJ({ ...j, requires_permit_above_amount: e.target.value === "" ? null : Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1">
          <Label>Prize cap</Label>
          <Input
            type="number"
            value={j.prize_cap_amount ?? ""}
            onChange={(e) => setJ({ ...j, prize_cap_amount: e.target.value === "" ? null : Number(e.target.value) })}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={j.requires_skill_question}
            onChange={(e) => setJ({ ...j, requires_skill_question: e.target.checked })}
          />
          Requires skill question
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={j.kyc_required_before_payout}
            onChange={(e) => setJ({ ...j, kyc_required_before_payout: e.target.checked })}
          />
          KYC required before payout
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label>Allowed entry methods</Label>
          <div className="mt-1 grid grid-cols-2 gap-1">
            {ENTRY_METHODS.map((m) => (
              <label key={`a-${m}`} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={j.allowed_entry_methods.includes(m)}
                  onChange={() => toggleMethod("allowed_entry_methods", m)}
                />
                {m}
              </label>
            ))}
          </div>
        </div>
        <div>
          <Label>Blocked entry methods</Label>
          <div className="mt-1 grid grid-cols-2 gap-1">
            {ENTRY_METHODS.map((m) => (
              <label key={`b-${m}`} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={j.blocked_entry_methods.includes(m)}
                  onChange={() => toggleMethod("blocked_entry_methods", m)}
                />
                {m}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-1">
        <Label>Notes</Label>
        <Textarea value={j.notes ?? ""} onChange={(e) => setJ({ ...j, notes: e.target.value })} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={save} disabled={busy}>
        {busy ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
