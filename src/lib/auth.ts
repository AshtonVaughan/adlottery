import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export interface SessionContext {
  userId: string;
  email: string;
  profile: Profile;
}

export async function getCurrentSession(): Promise<SessionContext | null> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    userId: user.id,
    email: user.email ?? profile.email,
    profile: profile as Profile,
  };
}

export async function requireUser(): Promise<SessionContext> {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin(): Promise<SessionContext> {
  const session = await requireUser();
  if (!session.profile.is_admin) redirect("/dashboard");
  return session;
}
