import Joi from "joi";

class AccountValidation {
  createAccount = Joi.object({
    name: Joi.string().min(2).max(100).required(),

    code: Joi.string().min(2).max(50).required(),

    type: Joi.string()
      .valid("asset", "liability", "equity", "revenue", "expense")
      .required(),

    parent_id: Joi.number().allow(null).optional(),

    description: Joi.string().allow("", null).optional(),

    currency: Joi.string().length(3).optional(), // EGP, USD, etc
  });

  updateAccount = Joi.object({
    id: Joi.number().required(),

    name: Joi.string().min(2).max(100).optional(),

    code: Joi.string().min(2).max(50).optional(),

    type: Joi.string()
      .valid("asset", "liability", "equity", "revenue", "expense")
      .optional(),

    parent_id: Joi.number().allow(null).optional(),

    description: Joi.string().allow("", null).optional(),

    currency: Joi.string().length(3).optional(),

  }).min(1); 

  idParam = Joi.object({
    id: Joi.number().required(),
  });
}

export const accountValidation = new AccountValidation();