import Joi from "joi";

class AuditLogsValidation {
  listQuery = Joi.object({
    entity_type: Joi.string().max(100).optional(),
    entity_id: Joi.number().integer().optional(),
    user_id: Joi.number().integer().optional(),
    action: Joi.string()
      .valid("CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "APPROVE", "REJECT")
      .optional(),
    from_date: Joi.date().iso().optional(),
    to_date: Joi.date().iso().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  });
}

export const auditLogsValidation = new AuditLogsValidation();
