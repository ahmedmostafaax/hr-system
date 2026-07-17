import Joi from "joi";

class AbsencesValidation {
  createAbsence = Joi.object({
    employee_id: Joi.number().required(),
    absence_type_id: Joi.number().required(),
    absence_date: Joi.date().iso().required(),
    deduction_days: Joi.number().min(0).precision(1).required(),
    notes: Joi.string().optional().allow(null, ""),
  });

  updateAbsence = Joi.object({
    id: Joi.number().required(),
    employee_id: Joi.number().optional(),
    absence_type_id: Joi.number().optional(),
    absence_date: Joi.date().iso().optional(),
    deduction_days: Joi.number().min(0).precision(1).optional(),
    notes: Joi.string().optional().allow(null, ""),
    is_deleted: Joi.boolean().optional(),
  });

  idParam = Joi.object({
    id: Joi.number().required(),
  });
}

export const absencesValidation = new AbsencesValidation();
