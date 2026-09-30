import { fail, json } from "@/lib/api";
import { runLifecycle } from "@/lib/draw";
import { isSupabaseConfigured } from "@/lib/config";

// Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET`.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return fail("Unauthorized.", 401);
  }
  if (!isSupabaseConfigured()) return fail("Supabase is not configured.", 503);
  return json(await runLifecycle());
}
