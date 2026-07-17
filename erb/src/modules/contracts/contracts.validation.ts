import Joi from "joi";

class ContractValidation {
  createContract = Joi.object({
    employee_id: Joi.number().required(),
    department_id: Joi.number().required(),
    shift_id: Joi.number().required(),
    job_title: Joi.string().min(2).max(200).required(),
    start_date: Joi.date().iso().required(),
    duration_years: Joi.number().optional().allow(null),
    end_date: Joi.date().iso().optional().allow(null),
    base_salary: Joi.number().positive().required(),
    status: Joi.string().valid("active", "suspended", "resigned", "dismissed").required(),
    overtime_enabled: Joi.boolean().optional(),
    notes: Joi.string().optional().allow("", null),
    attachment: Joi.string().max(500).optional().allow("", null),
    insurance_setting_id: Joi.number().required().allow(null),
  });

  updateContract = Joi.object({
    id: Joi.number().required(),
    employee_id: Joi.number().optional(),
    department_id: Joi.number().optional(),
    shift_id: Joi.number().optional(),
    job_title: Joi.string().min(2).max(200).optional(),
    start_date: Joi.date().iso().optional(),
    duration_years: Joi.number().optional().allow(null),
    end_date: Joi.date().iso().optional().allow(null),
    base_salary: Joi.number().positive().optional(),
    status: Joi.string().valid("active", "suspended", "resigned", "dismissed").optional(),
    overtime_enabled: Joi.boolean().optional(),
    notes: Joi.string().optional().allow("", null),
    attachment: Joi.string().max(500).optional().allow("", null),
    is_active: Joi.boolean().optional(),
    insurance_setting_id: Joi.number().optional().allow(null),
  });

  idParam = Joi.object({
    id: Joi.number().required(),
  });
}

export const contractValidation = new ContractValidation();
