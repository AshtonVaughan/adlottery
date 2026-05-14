"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { WinnerClaim } from "@/lib/types";

const CLAIM_STATUSES = [
  "pending",
  "verification_required",
  "skill_question_required",
  "verified",
  "rejected",
  "expired",
] as const;

const PAYOUT_STATUSES = [
  "not_started",
  "pending",
  "paid",
  "failed",
  "cancelled",
] as const;

export function ClaimAdminForm({ claim }: { claim: WinnerClaim }) {
  const router = useRouter();
  const [claimStatus, setClaimStatus] = useState(claim.claim_status);
  const [payoutStatus, setPayoutStatus] = useState(claim.payout_status);
  const [payoutRef, setPayoutRef] = useState(claim.payout_reference ?? "");
  const [notes, setNotes] = useState(claim.admin_notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/claims/${claim.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          claim_status: claimStatus,
          payout_status: payoutStatus,
          payout_reference: payoutRef || null,
          admin_notes: notes || null,
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
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label>Claim status</Label>
          <Select value={claimStatus} onChange={(e) => setClaimStatus(e.target.value as WinnerClaim["claim_status"])}>
            {CLAIM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Payout status</Label>
          <Select value={payoutStatus} onChange={(e) => setPayoutStatus(e.target.value as WinnerClaim["payout_status"])}>
            {PAYOUT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label>Payout reference</Label>
        <Input value={payoutRef} onChange={(e) => setPayoutRef(e.target.value)} placeholder="e.g. Wise tx id" />
      </div>
      <div className="space-y-1">
        <Label>Admin notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={save} disabled={busy}>
        {busy ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
