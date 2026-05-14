import { NextResponse, type NextRequest } from "next/server";
import { createDrawSchema } from "@/lib/validation";
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
  const parsed = createDrawSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid payload." },
      { status: 400 },
    );
  }
  if (new Date(parsed.data.ends_at) <= new Date(parsed.data.starts_at)) {
    return NextResponse.json(
      { error: "ends_at must be after starts_at." },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdminClient();
  const { data: existing } = await admin
    .from("draws")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "Draw not found." }, { status: 404 });
  }
  if (existing.status !== "draft") {
    return NextResponse.json(
      { error: "Only draft draws can be edited." },
      { status: 400 },
    );
  }

  const { error } = await admin
    .from("draws")
    .update({
      title: parsed.data.title,
      draw_type: parsed.data.draw_type,
      prize_amount: parsed.data.prize_amount,
      currency: parsed.data.currency.toUpperCase(),
      eligible_country_codes: parsed.data.eligible_country_codes.map((c) =>
        c.toUpperCase(),
      ),
      excluded_country_codes: parsed.data.excluded_country_codes.map((c) =>
        c.toUpperCase(),
      ),
      starts_at: parsed.data.starts_at,
      ends_at: parsed.data.ends_at,
      sponsor_name: parsed.data.sponsor_name ?? null,
      sponsor_url: parsed.data.sponsor_url ?? null,
      region_code: parsed.data.region_code ?? null,
    })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    actorUserId: guard.session.userId,
    action: "draw.update",
    entityType: "draw",
    entityId: id,
    metadata: parsed.data,
  });
  return NextResponse.json({ ok: true });
}
