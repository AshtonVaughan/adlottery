import { NextResponse, type NextRequest } from "next/server";
import { updateJurisdictionSchema } from "@/lib/validation";
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
  const parsed = updateJurisdictionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid payload." },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("jurisdictions")
    .update(parsed.data)
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    actorUserId: guard.session.userId,
    action: "jurisdiction.update",
    entityType: "jurisdiction",
    entityId: id,
    metadata: parsed.data,
  });
  return NextResponse.json({ ok: true });
}
