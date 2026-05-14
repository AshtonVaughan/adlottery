"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  flagId: string;
  status: string;
}

export function FraudFlagActions({ flagId, status }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function update(next: "dismissed" | "confirmed" | "reviewed") {
    setBusy(next);
    try {
      const res = await fetch(`/api/admin/fraud/${flagId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (status !== "open") {
    return <span className="text-xs text-muted-foreground">{status}</span>;
  }

  return (
    <div className="flex justify-end gap-1">
      <Button size="sm" variant="ghost" disabled={busy !== null} onClick={() => update("dismissed")}>
        {busy === "dismissed" ? "…" : "Dismiss"}
      </Button>
      <Button size="sm" variant="destructive" disabled={busy !== null} onClick={() => update("confirmed")}>
        {busy === "confirmed" ? "…" : "Confirm"}
      </Button>
    </div>
  );
}
