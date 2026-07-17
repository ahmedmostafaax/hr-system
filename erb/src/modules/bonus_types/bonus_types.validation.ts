import Joi from "joi";

class BonusTypesValidation {
  createBonusType = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    payment_type: Joi.string().valid("cash", "deferred").required(),
    default_amount: Joi.number().allow(null).optional(),
    editable_amount: Joi.boolean().optional(),
  });

  updateBonusType = Joi.object({
    id: Joi.number().required(),

    name: Joi.string().min(2).max(100).optional(),
    payment_type: Joi.string().valid("cash", "deferred").optional(),
    default_amount: Joi.number().allow(null).optional(),
    editable_amount: Joi.boolean().optional(),
  }).min(1);

  idParam = Joi.object({
    id: Joi.number().required(),
  });
}

export const bonusTypesValidation = new BonusTypesValidation();
