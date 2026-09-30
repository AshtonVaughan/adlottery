import { getSession } from "@/lib/auth";
import { getUserDrawStatus } from "@/lib/data";
import { entryBlock, ENTRY_BLOCK_MESSAGES } from "@/lib/eligibility";
import type { EnterState } from "@/components/enter-button";
import type { Draw } from "@/lib/types";

export async function getEnterState(draw: Draw | null, demo: boolean): Promise<EnterState> {
  if (demo) return { kind: "demo" };
  const session = await getSession();
  if (!session) return { kind: "signed_out" };

  const block = entryBlock(session.profile, draw);
  if (block === "needs_profile") return { kind: "needs_profile" };
  if (block || !draw) return { kind: "blocked", message: ENTRY_BLOCK_MESSAGES[block ?? "no_draw"] };

  const status = await getUserDrawStatus(session.userId, draw.id);
  return status.enteredToday
    ? { kind: "entered", entries: status.entriesThisDraw }
    : { kind: "ready", entries: status.entriesThisDraw };
}
