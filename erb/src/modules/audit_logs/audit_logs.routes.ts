import { Router } from "express";
import { auditLogsController } from "./audit_logs.controller";
import { auth } from "../auth/auth.controller";
import { validationMiddleware } from "../../middleware/validation";
import { auditLogsValidation } from "./audit_logs.validation";

const auditLogsRouter = Router();

auditLogsRouter.get(
  "/",
  auth.protectedRoutes,
  auth.allowedTo("SUPER-ADMIN", "ADMIN"),
  validationMiddleware.validate(auditLogsValidation.listQuery),
  auditLogsController.getAllAuditLogs
);

export default auditLogsRouter;
