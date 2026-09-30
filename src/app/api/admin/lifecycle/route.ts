import { requireAdminApi, json } from "@/lib/api";
import { runLifecycle } from "@/lib/draw";

export async function POST() {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  return json(await runLifecycle());
}
