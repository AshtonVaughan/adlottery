"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClaimEntryButtonProps {
  drawId: string;
  disabled?: boolean;
  disabledReason?: string;
  fullWidth?: boolean;
}

export function ClaimEntryButton({
  drawId,
  disabled,
  disabledReason,
  fullWidth = true,
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
      setMessage(
        `Entry locked in. You now hold ${json.total_user_entries} ${
          json.total_user_entries === 1 ? "entry" : "entries"
        } for this draw.${tail}`,
      );
      router.refresh();
    } catch {
      setError("Network error. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  if (disabled) {
    return (
      <div className="space-y-2">
        <Button disabled className={fullWidth ? "w-full" : ""}>
          <Ticket className="h-4 w-4" /> Claim free entry
        </Button>
        {disabledReason && (
          <p className="text-xs text-muted-foreground">{disabledReason}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleClick}
        disabled={busy}
        className={fullWidth ? "w-full" : ""}
      >
        <Ticket className="h-4 w-4" />
        {busy ? "Claiming…" : "Claim free entry"}
      </Button>
      {message && (
        <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground">
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
          <span>{message}</span>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
