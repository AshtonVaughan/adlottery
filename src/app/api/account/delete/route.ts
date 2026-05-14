import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { APP_URL } from "@/lib/constants";

export async function POST(_request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", APP_URL));
  }

  // V1: queue a deletion request via audit log. A real implementation
  // also tombstones the account, voids open entries, and forwards a
  // notification to the admin team for legal review.
  await writeAuditLog({
    actorUserId: user.id,
    action: "account.delete_request",
    entityType: "profile",
    entityId: user.id,
    metadata: { email: user.email },
  });

  const admin = getSupabaseAdminClient();
  // Mark profile as banned (soft-deactivate) so they can no longer claim.
  await admin
    .from("profiles")
    .update({ banned_at: new Date().toISOString(), eligibility_status: "blocked" })
    .eq("id", user.id);
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/?account=delete-requested", APP_URL));
}
