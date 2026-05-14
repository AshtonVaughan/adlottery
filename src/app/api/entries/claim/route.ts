import { NextResponse, type NextRequest } from "next/server";
import { claimEntrySchema } from "@/lib/validation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { claimDailyEntry } from "@/lib/entries";
import { rateLimit } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = claimEntrySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = request.headers.get("user-agent");

  const rl = rateLimit(`claim:${user.id}`, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Slow down — try again in a few seconds." },
      { status: 429 },
    );
  }

  const captcha = await verifyTurnstileToken(parsed.data.turnstile_token, ip);
  if (!captcha.ok) {
    return NextResponse.json({ error: captcha.reason }, { status: 400 });
  }

  const result = await claimDailyEntry({
    userId: user.id,
    drawId: parsed.data.draw_id,
    ip,
    userAgent,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    entry_id: result.entryId,
    referral_rewarded: result.referralRewarded ?? false,
    total_user_entries: result.totalUserEntries ?? 1,
  });
}
