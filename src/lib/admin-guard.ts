import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import type { SessionContext } from "@/lib/auth";

export async function requireAdminApi(): Promise<
  { ok: true; session: SessionContext } | { ok: false; response: NextResponse }
> {
  const session = await getCurrentSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Not signed in." }, { status: 401 }),
    };
  }
  if (!session.profile.is_admin) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Admins only." }, { status: 403 }),
    };
  }
  return { ok: true, session };
}
