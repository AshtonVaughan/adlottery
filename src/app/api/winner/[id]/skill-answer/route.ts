import { NextResponse, type NextRequest } from "next/server";
import { skillAnswerSchema } from "@/lib/validation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, ctx: RouteParams) {
  const { id } = await ctx.params;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = skillAnswerSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid answer." },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdminClient();
  const { data: claim } = await admin
    .from("winner_claims")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!claim || claim.user_id !== user.id) {
    return NextResponse.json({ error: "Claim not found." }, { status: 404 });
  }
  if (!claim.skill_question_required) {
    return NextResponse.json({ error: "No skill question required." }, { status: 400 });
  }
  if (claim.skill_question_answered) {
    return NextResponse.json({ error: "Answer already submitted." }, { status: 400 });
  }

  const { data: question } = await admin
    .from("skill_questions")
    .select("answer")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!question) {
    return NextResponse.json(
      { error: "No active skill question." },
      { status: 500 },
    );
  }

  const correct =
    parsed.data.answer.trim().toLowerCase() ===
    (question.answer as string).trim().toLowerCase();

  await admin
    .from("winner_claims")
    .update({
      skill_question_answered: true,
      skill_question_correct: correct,
      claim_status: correct ? "verification_required" : "rejected",
    })
    .eq("id", id);

  await writeAuditLog({
    actorUserId: user.id,
    action: "winner.skill_answer_submitted",
    entityType: "winner_claim",
    entityId: id,
    metadata: { correct },
  });

  return NextResponse.json({ ok: true, correct });
}
