import { NextResponse, type NextRequest } from "next/server";
import { createDrawSchema } from "@/lib/validation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { requireAdminApi } from "@/lib/admin-guard";

export async function POST(request: NextRequest) {
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
  const { data, error } = await admin
    .from("draws")
    .insert({
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
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Could not create draw." }, { status: 500 });
  }

  await writeAuditLog({
    actorUserId: guard.session.userId,
    action: "draw.create",
    entityType: "draw",
    entityId: data.id,
    metadata: parsed.data,
  });

  return NextResponse.json({ ok: true, id: data.id });
}
