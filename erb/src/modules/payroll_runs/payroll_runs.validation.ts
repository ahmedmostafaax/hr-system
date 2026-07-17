import Joi from "joi";

class PayrollRunsValidation {
  createPayrollRun = Joi.object({
    month: Joi.number().integer().min(1).max(12).required(),
    year: Joi.number().integer().min(2000).max(2100).required(),
    status: Joi.string().valid("draft", "confirmed", "paid").optional(),
    auto_process: Joi.boolean().optional().default(true),
  });

  updatePayrollRun = Joi.object({
    id: Joi.number().required(),
    month: Joi.number().integer().min(1).max(12).optional(),
    year: Joi.number().integer().min(2000).max(2100).optional(),
    status: Joi.string().valid("draft", "confirmed", "paid").optional(),
    is_deleted: Joi.boolean().optional(),
  });

  idParam = Joi.object({
    id: Joi.number().required(),
  });
}

export const payrollRunsValidation = new PayrollRunsValidation();
