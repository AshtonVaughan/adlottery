"use client";

import { supabase } from "@/lib/supabase";
import { SUPABASE_URL } from "@/lib/config";

// Only used with `npm run local`; these endpoints exist on the local backend only.

export async function localSignIn(email: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/__dev/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message ?? "Sign-in failed.");
  const { error } = await supabase()!.auth.setSession(body);
  if (error) throw new Error(error.message);
}

export async function localDrawNow(): Promise<string> {
  const { data } = await supabase()!.auth.getSession();
  const res = await fetch(`${SUPABASE_URL}/__dev/draw-now`, {
    method: "POST",
    headers: { authorization: `Bearer ${data.session?.access_token ?? ""}` },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message ?? "Draw failed.");
  const outcome = body.results?.[0]?.outcome ?? "nothing to draw";
  if (outcome.startsWith("error")) throw new Error(outcome);
  return outcome === "rolled_over" ? "No entries, so the pot rolled over." : "Drawn. Check the home page and results.";
}
