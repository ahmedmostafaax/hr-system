import Joi from "joi";

class AllowanceValidation {
  createAllowance = Joi.object({
    name: Joi.string().min(2).max(100).required(),

    default_amount: Joi.number().min(0).precision(2).optional(),

    is_part_of_salary: Joi.boolean().optional(),

    account_code: Joi.string().min(1).max(20).required(),
  });

  updateAllowance = Joi.object({
    id: Joi.number().required(),

    name: Joi.string().min(2).max(100).optional(),

    default_amount: Joi.number().min(0).precision(2).optional(),

    is_part_of_salary: Joi.boolean().optional(),

    account_code: Joi.string().min(1).max(20).optional(),
  }).min(1); 

  idParam = Joi.object({
    id: Joi.number().required(),
  });
}

export const allowanceValidation = new AllowanceValidation();