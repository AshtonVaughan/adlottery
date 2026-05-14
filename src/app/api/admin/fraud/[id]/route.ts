import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { requireAdminApi } from "@/lib/admin-guard";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateSchema = z.object({
  status: z.enum(["open", "reviewed", "dismissed", "confirmed"]),
});

export async function POST(request: NextRequest, ctx: RouteParams) {
  const { id } = await ctx.params;
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("fraud_flags")
    .update({
      status: parsed.data.status,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    actorUserId: guard.session.userId,
    action: "fraud_flag.update",
    entityType: "fraud_flag",
    entityId: id,
    metadata: { status: parsed.data.status },
  });
  return NextResponse.json({ ok: true });
}
