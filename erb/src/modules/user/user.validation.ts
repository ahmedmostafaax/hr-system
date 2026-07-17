import Joi from "joi";

class UserValidation {
  
  createUser = Joi.object({
    employee_id: Joi.number().integer().required(),

    name: Joi.string().min(3).max(100).optional(),

    email: Joi.string()
      .email({ tlds: { allow: true } })
      .pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|net|org|edu|gov)$/)
      .optional()
      .messages({
        "string.pattern.base": "Please use a valid professional email",
      }),

    phoneNumber: Joi.string()
      .pattern(/^01[0-2,5]{1}[0-9]{8}$/)
      .optional()
      .messages({
        "string.pattern.base": "Invalid Egyptian phone number",
      }),

    role: Joi.string()
      .valid("EMPLOYEE", "HR", "ACCOUNTING", "ADMIN", "SUPER-ADMIN")
      .default("EMPLOYEE")
      .optional(),
  });

  updateUser = Joi.object({
    id: Joi.number().integer().required(),

    name: Joi.string().min(3).max(100),

    email: Joi.string()
      .email({ tlds: { allow: true } })
      .pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|net|org|edu|gov)$/).optional(),

    phoneNumber: Joi.string().pattern(/^01[0-2,5]{1}[0-9]{8}$/).optional(),

    role: Joi.string()
      .valid("EMPLOYEE", "HR", "ACCOUNTING", "ADMIN", "SUPER-ADMIN")
      .optional(),

    isActive: Joi.boolean().optional(),

    isBlock: Joi.boolean().optional(),
  });

  getUserById = Joi.object({
    id: Joi.number().integer().required(),
  });

}

export const userValidation = new UserValidation();
