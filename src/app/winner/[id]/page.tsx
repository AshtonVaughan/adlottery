import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="container max-w-3xl space-y-6 py-12">
      <header className="space-y-2">
        <Badge variant="success">You won</Badge>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          {formatCurrency(Number(draw.prize_amount), draw.currency)}
        </h1>
        <p className="text-sm text-muted-foreground">
          {draw.title} ·{" "}
          {draw.published_at
            ? `published ${formatDateTime(draw.published_at)}`
            : "publication pending"}
        </p>
      </header>

      <Card>
        <CardContent className="space-y-3 p-6">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Claim status
          </p>
          <div className="space-y-2 text-sm">
            <Row label="Claim">
              <Badge variant="warning">{claim.claim_status}</Badge>
            </Row>
            <Row label="Payout">
              <Badge>{claim.payout_status}</Badge>
            </Row>
            {claim.payout_reference && (
              <Row label="Reference">
                <code className="font-mono text-foreground">
                  {claim.payout_reference}
                </code>
              </Row>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-6">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Identity verification
          </p>
          <p className="text-sm text-muted-foreground">
            We use a third-party identity provider (Stripe Identity placeholder)
            to verify winners before payout. This is mandatory in most regions.
          </p>
          <Button disabled>Start identity verification (coming soon)</Button>
        </CardContent>
      </Card>

      {claim.skill_question_required && (
        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Skill question
            </p>
            {claim.skill_question_answered ? (
              <p className="text-sm text-muted-foreground">
                Answer submitted. Awaiting admin review.
              </p>
            ) : skillQuestion ? (
              <SkillAnswerForm
                claimId={claim.id}
                question={skillQuestion.question as string}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                A skill question will be issued shortly.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Need help?{" "}
        <Link href="/legal/draw-rules" className="text-foreground hover:underline">
          Read the draw rules
        </Link>
      </p>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 border-b border-white/[0.04] pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 break-words text-foreground">{children}</span>
    </div>
  );
}
