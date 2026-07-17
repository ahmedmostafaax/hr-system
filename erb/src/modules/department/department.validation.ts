import Joi from "joi";

class DepartmentValidation {
   createDepartment = Joi.object({
    name: Joi.string().min(2).max(100).required(),

    parent_id: Joi.number().optional().allow(null),

    type: Joi.string().required(),
  });

   updateDepartment = Joi.object({
    id: Joi.number().required(),
    
    name: Joi.string().min(2).max(100).optional(),

    parent_id: Joi.number().optional().allow(null),

    type: Joi.string().optional(),

    isActive: Joi.boolean().optional(),
  });

   idParam = Joi.object({
    id: Joi.number().required(),
  });
}

export const departmentValidation = new DepartmentValidation();