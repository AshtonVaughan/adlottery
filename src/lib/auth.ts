import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { adminEmails, isSupabaseConfigured } from "@/lib/config";
import type { Profile } from "@/lib/types";

export interface Session {
  userId: string;
  email: string;
  profile: Profile;
  isAdmin: boolean;
}

export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await getSupabaseAdminClient()
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();
  if (!profile) return null;

  const email = (user.email ?? profile.email).toLowerCase();
  return {
    userId: user.id,
    email,
    profile,
    isAdmin: profile.is_admin || adminEmails().includes(email),
  };
}
