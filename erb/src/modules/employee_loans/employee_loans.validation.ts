import Joi from "joi";

class EmployeeLoansValidation {
  createLoan = Joi.object({
    employee_id: Joi.number().optional(),
    type: Joi.string().valid("advance", "loan").required(),
    amount: Joi.number().min(0).precision(2).required(),
    grant_date: Joi.date().iso().required(),
    installment_amount: Joi.number().min(0).precision(2).optional().allow(null, ""),
    paid_amount: Joi.number().min(0).precision(2).optional(),
    status: Joi.string().valid("active", "settled").optional(),
  });

  updateLoan = Joi.object({
    id: Joi.number().required(),
    employee_id: Joi.number().optional(),
    type: Joi.string().valid("advance", "loan").optional(),
    amount: Joi.number().min(0).precision(2).optional(),
    grant_date: Joi.date().iso().optional(),
    installment_amount: Joi.number().min(0).precision(2).optional().allow(null, ""),
    paid_amount: Joi.number().min(0).precision(2).optional(),
    status: Joi.string().valid("active", "settled").optional(),
    approval_status: Joi.string().valid("pending", "approved", "rejected").optional(),
    rejection_reason: Joi.string().optional().allow(null, ""),
    is_deleted: Joi.boolean().optional(),
  });

  idParam = Joi.object({
    id: Joi.number().required(),
  });
}

export const employeeLoansValidation = new EmployeeLoansValidation();
