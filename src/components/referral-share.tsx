"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_NAME } from "@/lib/constants";

interface ReferralShareProps {
  appUrl: string;
  referralCode: string;
}

export function ReferralShare({ appUrl, referralCode }: ReferralShareProps) {
  const url = `${appUrl}/?ref=${referralCode}`;
  const text = `Join me on ${APP_NAME} — free prize draws, no purchase required. Use my referral link: ${url}`;
  const [copiedField, setCopiedField] = useState<null | "url" | "text">(null);

  async function copy(value: string, which: "url" | "text") {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(which);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input readOnly value={url} aria-label="Referral link" />
        <Button variant="secondary" onClick={() => copy(url, "url")}>
          {copiedField === "url" ? "Copied" : "Copy link"}
        </Button>
      </div>
      <div className="flex gap-2">
        <Input readOnly value={text} aria-label="Share message" />
        <Button variant="secondary" onClick={() => copy(text, "text")}>
          {copiedField === "text" ? "Copied" : "Copy message"}
        </Button>
      </div>
    </div>
  );
}
