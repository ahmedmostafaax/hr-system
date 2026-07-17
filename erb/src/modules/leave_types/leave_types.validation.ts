import Joi from "joi";

class LeaveTypeValidation {
  createLeaveType = Joi.object({
    name: Joi.string().min(2).max(100).required(),

    annual_balance: Joi.number().integer().min(0).required(),

    affects_deduction: Joi.boolean().required(),
  });

  updateLeaveType = Joi.object({
    id: Joi.number().required(),

    name: Joi.string().min(2).max(100).optional(),

    annual_balance: Joi.number().integer().min(0).optional(),

    affects_deduction: Joi.boolean().optional(),

    is_deleted: Joi.boolean().optional(),
  });

  idParam = Joi.object({
    id: Joi.number().required(),
  });
}

export const leaveTypeValidation = new LeaveTypeValidation();