import AuditLog, { AuditAction } from "../../../database/Models/audit_logs";

export type { AuditAction };

export interface AuditLogInput {
  userId?: number | null;
  userName?: string | null;
  userRole?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: number | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

export class AuditService {
  static async log(input: AuditLogInput): Promise<void> {
    try {
      await AuditLog.create({
        user_id: input.userId ?? null,
        user_name: input.userName ?? null,
        user_role: input.userRole ?? null,
        action: input.action,
        entity_type: input.entityType,
        entity_id: input.entityId ?? null,
        old_values: input.oldValues ?? null,
        new_values: input.newValues ?? null,
        ip_address: input.ipAddress ?? null,
      });
    } catch (error) {
      console.error("❌ [AuditService] Failed to write audit log:", error);
    }
  }
}
