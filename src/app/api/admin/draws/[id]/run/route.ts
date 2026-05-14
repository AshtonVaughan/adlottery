import { NextResponse, type NextRequest } from "next/server";
import { runDrawSchema } from "@/lib/validation";
import { runDraw } from "@/lib/draw";
import { requireAdminApi } from "@/lib/admin-guard";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, ctx: RouteParams) {
  const { id } = await ctx.params;
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = runDrawSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const result = await runDraw({
    drawId: id,
    publicSeed: parsed.data.public_seed,
    randomnessSource: parsed.data.randomness_source,
    actorUserId: guard.session.userId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }
  return NextResponse.json({ ok: true, winning_entry_id: result.winningEntryId });
}
