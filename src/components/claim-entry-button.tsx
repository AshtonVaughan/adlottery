"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ClaimEntryButtonProps {
  drawId: string;
  disabled?: boolean;
  disabledReason?: string;
}

export function ClaimEntryButton({
  drawId,
  disabled,
  disabledReason,
}: ClaimEntryButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/entries/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ draw_id: drawId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not claim entry.");
        return;
      }
      const tail = json.referral_rewarded
        ? " A referral bonus was also awarded."
        : "";
      setMessage(`Entry claimed. You now have ${json.total_user_entries} entries.${tail}`);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  if (disabled) {
    return (
      <div className="space-y-1">
        <Button disabled className="w-full sm:w-auto">Claim free entry</Button>
        {disabledReason && (
          <p className="text-xs text-muted-foreground">{disabledReason}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleClick} disabled={busy} className="w-full sm:w-auto">
        {busy ? "Claiming…" : "Claim free entry"}
      </Button>
      {message && <p className="text-sm text-success">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
