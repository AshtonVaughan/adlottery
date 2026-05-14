import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function writeAuditLog(params: {
  actorUserId: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  const admin = getSupabaseAdminClient();
  await admin.from("audit_logs").insert({
    actor_user_id: params.actorUserId,
    action: params.action,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
    metadata: params.metadata ?? null,
  });
}
