import Joi from "joi";

class LeaveRequestsValidation {
  createLeaveRequest = Joi.object({
    employee_id: Joi.number().optional(),
    leave_type_id: Joi.number().required(),
    start_date: Joi.alternatives()
      .try(Joi.date(), Joi.string().pattern(/^\d{4}-\d{2}-\d{2}/))
      .required(),
    end_date: Joi.alternatives()
      .try(Joi.date(), Joi.string().pattern(/^\d{4}-\d{2}-\d{2}/))
      .required(),
    days_count: Joi.number().min(1).precision(1).required(),
    status: Joi.string().valid("pending", "approved", "rejected").optional(),
  });

  updateLeaveRequest = Joi.object({
    id: Joi.number().required(),
    employee_id: Joi.number().optional(),
    leave_type_id: Joi.number().optional(),
    start_date: Joi.date().iso().optional(),
    end_date: Joi.date().iso().optional(),
    days_count: Joi.number().min(0).precision(1).optional(),
    status: Joi.string().valid("pending", "approved", "rejected").optional(),
    reason: Joi.string().optional().allow(null, ""),
    is_deleted: Joi.boolean().optional(), 
  });

  idParam = Joi.object({
    id: Joi.number().required(),
  });
}

export const leaveRequestsValidation = new LeaveRequestsValidation();
