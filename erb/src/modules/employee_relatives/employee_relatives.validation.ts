import Joi from "joi";

class EmployeeRelativeValidation {
   createRelative = Joi.object({
    employee_id: Joi.number().required(),
    relation: Joi.string().max(50).required(),
    name: Joi.string().max(200).required(),
    phone: Joi.string().max(20).required(),
  });

   updateRelative = Joi.object({
    id: Joi.number().required(),
    employee_id: Joi.number().optional(),
    relation: Joi.string().max(50).optional(),
    name: Joi.string().max(200).optional(),
    phone: Joi.string().max(20).optional(),
    is_deleted: Joi.boolean().optional(),
  });

   idParam = Joi.object({
    id: Joi.number().required(),
  });
}

export const employeeRelativeValidation = new EmployeeRelativeValidation();
