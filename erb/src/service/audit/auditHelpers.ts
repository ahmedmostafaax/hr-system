import { Request } from "express";
import { AuditService } from "./audit.service";
import type { AuditAction } from "../../../database/Models/audit_logs";

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordResetToken",
  "passwordResetTokenExpire",
  "resetCode",
]);

export function getClientIp(req: Request): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }
  return req.ip ?? null;
}

export function auditContextFromReq(req: Request) {
  const user = (req as any).user;
  return {
    userId: user?.id ?? null,
    userName: user?.name ?? null,
    userRole: user?.role ?? null,
    ipAddress: getClientIp(req),
  };
}

export function toAuditSnapshot(record: unknown): Record<string, unknown> | null {
  if (!record) {
    return null;
  }

  const data: Record<string, unknown> =
    typeof (record as any).toJSON === "function"
      ? (record as any).toJSON()
      : { ...(record as Record<string, unknown>) };

  for (const key of SENSITIVE_KEYS) {
    delete data[key];
  }

  return data;
}

export async function auditFromRequest(
  req: Request,
  params: {
    action: AuditAction;
    entityType: string;
    entityId?: number | null;
    oldValues?: Record<string, unknown> | null;
    newValues?: Record<string, unknown> | null;
    userId?: number | null;
    userName?: string | null;
    userRole?: string | null;
  }
): Promise<void> {
  const ctx = auditContextFromReq(req);

  await AuditService.log({
    userId: params.userId !== undefined ? params.userId : ctx.userId,
    userName: params.userName !== undefined ? params.userName : ctx.userName,
    userRole: params.userRole !== undefined ? params.userRole : ctx.userRole,
    ipAddress: ctx.ipAddress,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId ?? null,
    oldValues: params.oldValues ?? null,
    newValues: params.newValues ?? null,
  });
}
