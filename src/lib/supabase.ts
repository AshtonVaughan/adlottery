"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEMO, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/config";

let client: SupabaseClient | null = null;

/** Browser Supabase client (anon key), or null in demo mode. */
export function supabase(): SupabaseClient | null {
  if (DEMO || typeof window === "undefined") return null;
  client ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}
