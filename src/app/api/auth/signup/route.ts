import { NextResponse, type NextRequest } from "next/server";
import { signupSchema } from "@/lib/validation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { evaluateEligibility } from "@/lib/jurisdictions";
import { generateReferralCode } from "@/lib/referral";
import { regionForCountry } from "@/lib/regions";
import { writeAuditLog } from "@/lib/audit";
import { ADMIN_EMAILS, LEGAL_VERSIONS } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import type { Jurisdiction, Profile } from "@/lib/types";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(`signup:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many sign-up attempts. Try again shortly." },
      { status: 429 },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid form data." },
      { status: 400 },
    );
  }

  const captcha = await verifyTurnstileToken(parsed.data.turnstile_token, ip);
  if (!captcha.ok) {
    return NextResponse.json({ error: captcha.reason }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const email = parsed.data.email.toLowerCase();
  const countryCode = parsed.data.country_code.toUpperCase();
  const regionCode = regionForCountry(countryCode);

  // Look up jurisdiction.
  const { data: jurisdiction } = await admin
    .from("jurisdictions")
    .select("*")
    .eq("country_code", countryCode)
    .maybeSingle<Jurisdiction>();

  if (!jurisdiction) {
    return NextResponse.json(
      { error: "Your country is not currently supported." },
      { status: 400 },
    );
  }

  if (jurisdiction.status === "blocked") {
    return NextResponse.json(
      { error: "Your region is not eligible to sign up.", redirect: "waitlist" },
      { status: 403 },
    );
  }

  if (jurisdiction.status === "waitlist") {
    await admin.from("waitlist").upsert(
      { email, country_code: countryCode, source: "signup" },
      { onConflict: "email,country_code", ignoreDuplicates: true },
    );
    return NextResponse.json(
      { error: "Your region is on the waitlist.", redirect: "waitlist" },
      { status: 403 },
    );
  }

  const eligibility = evaluateEligibility({
    jurisdiction,
    dob: parsed.data.dob,
  });
  if (eligibility.status === "blocked") {
    return NextResponse.json(
      { error: eligibility.reason ?? "Not eligible." },
      { status: 403 },
    );
  }

  // Validate referral code, if any. Self-referral and duplicates rejected.
  let referrerProfile:
    | (Pick<Profile, "id" | "email"> & { id: string })
    | null = null;
  if (parsed.data.referral_code) {
    const { data } = await admin
      .from("profiles")
      .select("id, email")
      .eq("referral_code", parsed.data.referral_code.toUpperCase())
      .maybeSingle();
    if (data) {
      if (data.email.toLowerCase() === email) {
        return NextResponse.json(
          { error: "You cannot use your own referral code." },
          { status: 400 },
        );
      }
      referrerProfile = data as { id: string; email: string };
    }
  }

  // Create the auth user.
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: { country_code: countryCode },
    });

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message ?? "Could not create account." },
      { status: 400 },
    );
  }

  // Generate a unique referral code (retry a few times if we collide).
  let referralCode = generateReferralCode();
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("referral_code", referralCode)
      .maybeSingle();
    if (!existing) break;
    referralCode = generateReferralCode();
  }

  const isAdmin = ADMIN_EMAILS.includes(email);
  const acceptedAt = new Date().toISOString();

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    email,
    dob: parsed.data.dob,
    country_code: countryCode,
    region_code: regionCode,
    state_or_province: parsed.data.state_or_province ?? null,
    is_admin: isAdmin,
    referral_code: referralCode,
    referred_by: referrerProfile?.id ?? null,
    terms_accepted_at: acceptedAt,
    privacy_accepted_at: acceptedAt,
    draw_rules_accepted_at: acceptedAt,
    eligibility_status: eligibility.status,
  });

  if (profileError) {
    // Roll back the auth user so a failed insert doesn't leave a ghost.
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (referrerProfile) {
    await admin.from("referrals").insert({
      referrer_user_id: referrerProfile.id,
      referred_user_id: created.user.id,
      status: "pending",
    });
  }

  await writeAuditLog({
    actorUserId: created.user.id,
    action: "auth.signup",
    entityType: "profile",
    entityId: created.user.id,
    metadata: {
      country_code: countryCode,
      region_code: regionCode,
      eligibility_status: eligibility.status,
      legal_versions: LEGAL_VERSIONS,
    },
  });

  // Sign the user in by issuing a session via the route's response cookies.
  // The simplest path is to ask the client to log in next — the client will
  // call signInWithPassword and the middleware will set cookies. We avoid
  // generating tokens here to keep this server-only and small.
  return NextResponse.json({ ok: true, user_id: created.user.id });
}
