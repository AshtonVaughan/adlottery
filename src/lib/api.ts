import { NextResponse } from "next/server";
import { getSession, type Session } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function readJson(request: Request): Promise<unknown> {
  return request.json().catch(() => null);
}

type Guard = { ok: true; session: Session } | { ok: false; response: NextResponse };

export async function requireSessionApi(): Promise<Guard> {
  if (!isSupabaseConfigured()) {
    return { ok: false, response: fail("Demo mode: connect Supabase to enable this.", 503) };
  }
  const session = await getSession();
  if (!session) return { ok: false, response: fail("Sign in first.", 401) };
  return { ok: true, session };
}

export async function requireAdminApi(): Promise<Guard> {
  const guard = await requireSessionApi();
  if (guard.ok && !guard.session.isAdmin) {
    return { ok: false, response: fail("Admins only.", 403) };
  }
  return guard;
}
