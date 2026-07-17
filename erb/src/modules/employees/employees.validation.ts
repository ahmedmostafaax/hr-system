import Joi from "joi";

class EmployeeValidation {
   createEmployee = Joi.object({
    code: Joi.string().max(20).required(),
    full_name: Joi.string().max(200).required(),
    birth_date: Joi.date().iso().required(),
    gender: Joi.string().valid("M", "F").required(),
    national_id: Joi.string().length(14).required(),
    phone_number: Joi.string().max(20).required(),
    phone: Joi.string().max(20).optional().allow(null, ""),
    email: Joi.string().email().max(200).required(),
    address: Joi.string().optional().allow(null, ""),
    marital_status: Joi.string().valid("single", "married", "divorced", "widowed").optional().allow(null, ""),
    qualification: Joi.string().max(200).optional().allow(null, ""),
    bank_name: Joi.string().max(100).optional().allow(null, ""),
    bank_account: Joi.string().max(50).optional().allow(null, ""),
    user_role: Joi.string()
      .valid("EMPLOYEE", "HR", "ACCOUNTING", "ADMIN", "SUPER-ADMIN")
      .optional(),
  });

   updateEmployee = Joi.object({
    id: Joi.number().required(),
    code: Joi.string().max(20).optional(),
    full_name: Joi.string().max(200).optional(),
    birth_date: Joi.date().iso().optional(),
    gender: Joi.string().valid("M", "F").optional(),
    national_id: Joi.string().length(14).optional(),
    phone_number: Joi.string().max(20).optional(),
    phone: Joi.string().max(20).optional().allow(null, ""),
    email: Joi.string().email().max(200).optional().allow(null, ""),
    address: Joi.string().optional().allow(null, ""),
    marital_status: Joi.string().valid("single", "married", "divorced", "widowed").optional().allow(null, ""),
    qualification: Joi.string().max(200).optional().allow(null, ""),
    bank_name: Joi.string().max(100).optional().allow(null, ""),
    bank_account: Joi.string().max(50).optional().allow(null, ""),
    is_active: Joi.boolean().optional(),
    is_deleted: Joi.boolean().optional(),
  });

   idParam = Joi.object({
    id: Joi.number().required(),
  });
}

export const employeeValidation = new EmployeeValidation();
