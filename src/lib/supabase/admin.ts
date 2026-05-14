import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. NEVER import this from a "use client"
 * file. It bypasses RLS and is only safe inside Route Handlers,
 * Server Actions, and edge functions running on the server.
 */
export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase admin client missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
