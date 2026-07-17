import Joi from "joi";

class EmployeeBonusesValidation {
  createBonus = Joi.object({
    employee_id: Joi.number().required(),
    bonus_type_id: Joi.number().required(),
    amount: Joi.number().min(0).precision(2).required(),
    grant_date: Joi.date().iso().required(),
    is_paid: Joi.boolean().optional(),
    payment_month: Joi.number().min(1).max(12).optional().allow(null, ""),
    payment_year: Joi.number().min(1900).optional().allow(null, ""),
  });

  updateBonus = Joi.object({
    id: Joi.number().required(),
    employee_id: Joi.number().optional(),
    bonus_type_id: Joi.number().optional(),
    amount: Joi.number().min(0).precision(2).optional(),
    grant_date: Joi.date().iso().optional(),
    is_paid: Joi.boolean().optional(),
    payment_month: Joi.number().min(1).max(12).optional().allow(null, ""),
    payment_year: Joi.number().min(1900).optional().allow(null, ""),
    approval_status: Joi.string().valid("pending", "approved", "rejected").optional(),
    rejection_reason: Joi.string().optional().allow(null, ""),
    is_deleted: Joi.boolean().optional(),
  });

  idParam = Joi.object({
    id: Joi.number().required(),
  });
}

export const employeeBonusesValidation = new EmployeeBonusesValidation();
