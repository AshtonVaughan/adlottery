import { NextResponse, type NextRequest } from "next/server";
import { runDraw } from "@/lib/draw";
import { requireAdminApi } from "@/lib/admin-guard";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// The seed and randomness were committed at activation; the admin
// supplies nothing here, so they cannot influence the result.
export async function POST(_request: NextRequest, ctx: RouteParams) {
  const { id } = await ctx.params;
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const result = await runDraw({
    drawId: id,
    actorUserId: guard.session.userId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }
  return NextResponse.json({ ok: true, winning_entry_id: result.winningEntryId });
}
