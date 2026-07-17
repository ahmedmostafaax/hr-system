import { Request } from "express";
import { AppError } from "./appError";

const APPROVAL_ROLES = ["ACCOUNTING", "ADMIN", "SUPER-ADMIN"];

export function assertCanChangeApprovalStatus(req: Request): void {
  const role = (req as any).user?.role;
  if (!APPROVAL_ROLES.includes(role)) {
    throw new AppError(
      "Only accounting or admin can approve or reject loans and bonuses",
      403
    );
  }
}
