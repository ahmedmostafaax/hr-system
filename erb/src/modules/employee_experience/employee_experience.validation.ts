import Joi from "joi";

class EmployeeExperienceValidation {
   createExperience = Joi.object({
    employee_id: Joi.number().required(),
    company_name: Joi.string().max(200).required(),
    position: Joi.string().max(200).optional().allow(null, ""),
    from_date: Joi.date().iso().required(),
    to_date: Joi.date().iso().optional().allow(null, ""),
  });

   updateExperience = Joi.object({
    id: Joi.number().required(),
    employee_id: Joi.number().optional(),
    company_name: Joi.string().max(200).optional(),
    position: Joi.string().max(200).optional().allow(null, ""),
    from_date: Joi.date().iso().optional(),
    to_date: Joi.date().iso().optional().allow(null, ""),
    is_deleted: Joi.boolean().optional(),
  });

   idParam = Joi.object({
    id: Joi.number().required(),
  });
}

export const employeeExperienceValidation = new EmployeeExperienceValidation();
