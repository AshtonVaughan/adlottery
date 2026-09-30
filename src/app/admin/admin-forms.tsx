"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WinnerStatus } from "@/lib/types";

function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function post(path: string, body: unknown, success: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ ok: false, text: data.error ?? "Failed." });
        return null;
      }
      setMessage({ ok: true, text: success });
      router.refresh();
      return data;
    } finally {
      setBusy(false);
    }
  }

  const note = message && (
    <p className={`text-sm ${message.ok ? "text-good" : "text-bad"}`}>{message.text}</p>
  );
  return { busy, post, note };
}

export function LifecycleButton() {
  const { busy, post, note } = useAction();
  return (
    <div className="space-y-2 text-right">
      <button className="btn-ghost" disabled={busy} onClick={() => post("/api/admin/lifecycle", {}, "Lifecycle ran.")}>
        {busy ? "Running…" : "Run lifecycle now"}
      </button>
      {note}
    </div>
  );
}

export function ContributionForm({ drawId }: { drawId: string }) {
  const { busy, post, note } = useAction();
  const [source, setSource] = useState<"sponsor" | "ads">("sponsor");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const res = await post("/api/admin/contributions", { draw_id: drawId, source, amount, note: memo }, "Added to the pot.");
        if (res) {
          setAmount("");
          setMemo("");
        }
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <select className="field" value={source} onChange={(e) => setSource(e.target.value as "sponsor" | "ads")}>
          <option value="sponsor">Sponsor money</option>
          <option value="ads">Gross ad revenue</option>
        </select>
        <input className="field num" required inputMode="decimal" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <input className="field" placeholder="Note (optional, public)" value={memo} onChange={(e) => setMemo(e.target.value)} />
      <button className="btn-dark w-full" disabled={busy}>Add to pot</button>
      {note}
    </form>
  );
}

export function SponsorForm({ drawId }: { drawId: string }) {
  const { busy, post, note } = useAction();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [tagline, setTagline] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        post("/api/admin/sponsor", { draw_id: drawId, name, url, tagline }, "Sponsor set.");
      }}
    >
      <input className="field" required placeholder="Sponsor name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="field" type="url" placeholder="https://sponsor.com" value={url} onChange={(e) => setUrl(e.target.value)} />
      <input className="field" placeholder="Tagline (optional)" value={tagline} onChange={(e) => setTagline(e.target.value)} />
      <button className="btn-dark w-full" disabled={busy}>Set sponsor</button>
      {note}
    </form>
  );
}

export function WinnerActions({ drawId, status }: { drawId: string; status: WinnerStatus }) {
  const { busy, post, note } = useAction();
  const [reference, setReference] = useState("");
  const path = `/api/admin/winners/${drawId}`;
  if (status === "paid" || status === "forfeited") return null;

  return (
    <div className="flex flex-col items-stretch gap-2 md:w-56">
      {status === "claimed" && (
        <button className="btn-dark h-9" disabled={busy} onClick={() => post(path, { status: "verified" }, "Verified.")}>
          Mark ID verified
        </button>
      )}
      {status === "verified" && (
        <>
          <input className="field h-9" placeholder="Payout reference" value={reference} onChange={(e) => setReference(e.target.value)} />
          <button
            className="btn-dark h-9"
            disabled={busy || !reference}
            onClick={() => post(path, { status: "paid", payout_reference: reference }, "Marked paid.")}
          >
            Mark paid
          </button>
        </>
      )}
      <button
        className="btn-ghost h-9"
        disabled={busy}
        onClick={() => {
          if (confirm("Forfeit this prize? The money rolls into the current pot.")) {
            post(path, { status: "forfeited" }, "Forfeited and rolled over.");
          }
        }}
      >
        Forfeit
      </button>
      {note}
    </div>
  );
}

export function BanForm() {
  const { busy, post, note } = useAction();
  const [email, setEmail] = useState("");
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input className="field" type="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn-dark shrink-0" disabled={busy || !email} onClick={() => post("/api/admin/ban", { email, banned: true }, "Banned.")}>
          Ban
        </button>
        <button className="btn-ghost shrink-0" disabled={busy || !email} onClick={() => post("/api/admin/ban", { email, banned: false }, "Unbanned.")}>
          Unban
        </button>
      </div>
      {note}
    </div>
  );
}
