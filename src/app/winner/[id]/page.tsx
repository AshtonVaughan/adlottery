import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkillAnswerForm } from "@/components/skill-answer-form";
import { requireUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Draw, WinnerClaim } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WinnerClaimPage({ params }: PageProps) {
  const { id } = await params;
  const { userId } = await requireUser();
  const admin = getSupabaseAdminClient();

  const { data: claim } = await admin
    .from("winner_claims")
    .select("*")
    .eq("id", id)
    .maybeSingle<WinnerClaim>();
  if (!claim || claim.user_id !== userId) notFound();

  const { data: draw } = await admin
    .from("draws")
    .select("*")
    .eq("id", claim.draw_id)
    .maybeSingle<Draw>();
  if (!draw) notFound();

  const { data: skillQuestion } = claim.skill_question_required
    ? await admin
        .from("skill_questions")
        .select("id, question")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  return (
    <div className="container max-w-2xl space-y-6 py-12">
      <header>
        <Badge variant="info">Winner claim</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          You won {formatCurrency(Number(draw.prize_amount), draw.currency)}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Draw: {draw.title} ·{" "}
          {draw.published_at ? formatDateTime(draw.published_at) : "pending publication"}
        </p>
      </header>

      <Card>
        <CardHeader><CardTitle>Claim status</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Status"><Badge variant="warning">{claim.claim_status}</Badge></Row>
          <Row label="Payout status">{claim.payout_status}</Row>
          {claim.payout_reference && (
            <Row label="Reference"><code>{claim.payout_reference}</code></Row>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Identity verification</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            We use a third-party identity verification provider (Stripe Identity
            placeholder). You will be prompted to complete verification before
            payout. This is mandatory in most regions.
          </p>
          <Button disabled>Start identity verification (coming soon)</Button>
        </CardContent>
      </Card>

      {claim.skill_question_required && (
        <Card>
          <CardHeader><CardTitle>Skill question</CardTitle></CardHeader>
          <CardContent className="text-sm">
            {claim.skill_question_answered ? (
              <p className="text-muted-foreground">
                Answer submitted. Awaiting admin review.
              </p>
            ) : skillQuestion ? (
              <SkillAnswerForm
                claimId={claim.id}
                question={skillQuestion.question as string}
              />
            ) : (
              <p className="text-muted-foreground">
                A skill question will be issued shortly.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Need help?{" "}
        <Link href="/legal/draw-rules" className="hover:text-foreground">
          Read the draw rules
        </Link>
      </p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="col-span-2 break-words text-foreground">{children}</span>
    </div>
  );
}
