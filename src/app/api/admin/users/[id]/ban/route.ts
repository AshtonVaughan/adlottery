import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { requireAdminApi } from "@/lib/admin-guard";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, ctx: RouteParams) {
  const { id } = await ctx.params;
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ banned_at: new Date().toISOString(), eligibility_status: "blocked" })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    actorUserId: guard.session.userId,
    action: "user.ban",
    entityType: "profile",
    entityId: id,
  });
  return NextResponse.json({ ok: true });
}
