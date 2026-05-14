import { NextResponse, type NextRequest } from "next/server";
import { winnerClaimUpdateSchema } from "@/lib/validation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { requireAdminApi } from "@/lib/admin-guard";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, ctx: RouteParams) {
  const { id } = await ctx.params;
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = winnerClaimUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid payload." },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("winner_claims")
    .update({
      ...(parsed.data.claim_status && { claim_status: parsed.data.claim_status }),
      ...(parsed.data.payout_status && { payout_status: parsed.data.payout_status }),
      payout_reference: parsed.data.payout_reference ?? null,
      admin_notes: parsed.data.admin_notes ?? null,
    })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    actorUserId: guard.session.userId,
    action: "winner_claim.update",
    entityType: "winner_claim",
    entityId: id,
    metadata: parsed.data,
  });
  return NextResponse.json({ ok: true });
}
