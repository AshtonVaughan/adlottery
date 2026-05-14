"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SkillAnswerFormProps {
  claimId: string;
  question: string;
}

export function SkillAnswerForm({ claimId, question }: SkillAnswerFormProps) {
  const router = useRouter();
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/winner/${claimId}/skill-answer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Submission failed.");
        return;
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <Label htmlFor="skill-q">{question}</Label>
        <Input
          id="skill-q"
          required
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit answer"}
      </Button>
    </form>
  );
}
