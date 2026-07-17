import Joi from "joi";

class AttendanceValidation {
  createAttendance = Joi.object({
    employee_id: Joi.number().required(),
    work_date: Joi.alternatives()
      .try(Joi.date(), Joi.string().pattern(/^\d{4}-\d{2}-\d{2}/))
      .optional(),
    check_in: Joi.string().optional().allow(null, ""),
    check_out: Joi.string().optional().allow(null, ""),
    action: Joi.string().valid("auto", "check_in", "check_out").optional(),
    notes: Joi.string().optional().allow(null, ""),
  });

  updateAttendance = Joi.object({
    id: Joi.number().required(),
    employee_id: Joi.number().optional(),
    department_id: Joi.number().optional(),
    work_date: Joi.date().iso().optional(),
    check_in: Joi.string().optional().allow(null, ""),
    check_out: Joi.string().optional().allow(null, ""),
    late_hours: Joi.number().min(0).precision(2).optional(),
    overtime_hours: Joi.number().min(0).precision(2).optional(),
    notes: Joi.string().optional().allow(null, ""),
    is_deleted: Joi.boolean().optional(),
  });

  idParam = Joi.object({
    id: Joi.number().required(),
  });
}

export const attendanceValidation = new AttendanceValidation();
