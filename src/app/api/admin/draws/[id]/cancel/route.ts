import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { requireAdminApi } from "@/lib/admin-guard";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const cancelSchema = z.object({ reason: z.string().min(4).max(2000) });

export async function POST(request: NextRequest, ctx: RouteParams) {
  const { id } = await ctx.params;
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = cancelSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "A reason of at least 4 characters is required." },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("draws")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    actorUserId: guard.session.userId,
    action: "draw.cancel",
    entityType: "draw",
    entityId: id,
    metadata: { reason: parsed.data.reason },
  });
  return NextResponse.json({ ok: true });
}
