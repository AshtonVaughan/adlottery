"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Draw } from "@/lib/types";
import { drandRoundTime } from "@/lib/drand";

interface Props {
  draw: Draw;
  hasEntries: boolean;
  hasClaim: boolean;
}

export function AdminDrawActions({ draw, hasEntries }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  async function call(path: string, body: object = {}, name: string) {
    setBusy(name);
    setError(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Action failed.");
        return false;
      }
      router.refresh();
      return true;
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Lifecycle</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {draw.status === "draft" && (
            <Button
              onClick={() => call(`/api/admin/draws/${draw.id}/activate`, {}, "activate")}
              disabled={busy !== null}
            >
              Activate
            </Button>
          )}
          {draw.status === "active" && (
            <Button
              onClick={() => call(`/api/admin/draws/${draw.id}/lock`, {}, "lock")}
              disabled={busy !== null}
              variant="secondary"
            >
              Lock draw (no more entries)
            </Button>
          )}
          {draw.status === "drawn" && draw.published_at == null && (
            <Button
              onClick={() => call(`/api/admin/draws/${draw.id}/publish`, {}, "publish")}
              disabled={busy !== null}
            >
              Publish result
            </Button>
          )}
        </div>

        {draw.status === "locked" && (
          <div className="space-y-3 rounded-md border border-border/60 p-3">
            <p className="text-sm font-semibold">Run draw</p>
            <p className="text-xs text-muted-foreground">
              The winner is computed from the seed committed at activation and
              drand round {draw.randomness_round ?? "—"}
              {draw.randomness_round
                ? ` (available ${drandRoundTime(draw.randomness_round).toLocaleString()})`
                : ""}
              . Nothing is entered here, so the result can&apos;t be steered.
            </p>
            <Button
              disabled={busy !== null || !hasEntries || !draw.randomness_round}
              onClick={() => call(`/api/admin/draws/${draw.id}/run`, {}, "run")}
            >
              {busy === "run" ? "Drawing…" : "Run draw"}
            </Button>
            {!hasEntries && (
              <p className="text-xs text-destructive">No entries — cannot draw.</p>
            )}
          </div>
        )}

        {(draw.status === "draft" ||
          draw.status === "active" ||
          draw.status === "locked") && (
          <div className="space-y-2 rounded-md border border-destructive/30 p-3">
            <p className="text-sm font-semibold text-destructive">Cancel draw</p>
            <Textarea
              placeholder="Reason (logged in audit trail)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <Button
              variant="destructive"
              disabled={busy !== null || cancelReason.length < 4}
              onClick={() =>
                call(
                  `/api/admin/draws/${draw.id}/cancel`,
                  { reason: cancelReason },
                  "cancel",
                )
              }
            >
              {busy === "cancel" ? "Cancelling…" : "Cancel draw"}
            </Button>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
