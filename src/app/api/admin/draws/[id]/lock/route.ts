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
  const { data: draw } = await admin
    .from("draws")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!draw) return NextResponse.json({ error: "Draw not found." }, { status: 404 });
  if (draw.status !== "active") {
    return NextResponse.json(
      { error: "Only active draws can be locked." },
      { status: 400 },
    );
  }

  const { error } = await admin.from("draws").update({ status: "locked" }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    actorUserId: guard.session.userId,
    action: "draw.lock",
    entityType: "draw",
    entityId: id,
  });
  return NextResponse.json({ ok: true });
}
