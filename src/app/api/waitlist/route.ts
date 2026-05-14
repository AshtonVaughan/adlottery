import { NextResponse, type NextRequest } from "next/server";
import { waitlistSchema } from "@/lib/validation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = rateLimit(`waitlist:${ip}`, 10, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429 },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = waitlistSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid payload" },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("waitlist").upsert(
    {
      email: parsed.data.email.toLowerCase(),
      country_code: parsed.data.country_code.toUpperCase(),
      source: parsed.data.source ?? null,
    },
    { onConflict: "email,country_code", ignoreDuplicates: true },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
