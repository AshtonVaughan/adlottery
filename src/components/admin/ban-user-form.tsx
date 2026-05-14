"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BanUserForm({ userId, banned }: { userId: string; banned: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/${banned ? "unban" : "ban"}`, {
        method: "POST",
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <Button size="sm" variant={banned ? "outline" : "destructive"} disabled={busy} onClick={toggle}>
      {busy ? "…" : banned ? "Unban" : "Ban"}
    </Button>
  );
}
