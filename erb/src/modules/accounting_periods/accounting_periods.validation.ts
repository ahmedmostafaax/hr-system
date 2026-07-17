import Joi from "joi";

class AccountingPeriodsValidation {
  createAccountingPeriod = Joi.object({
    month: Joi.number().integer().min(1).max(12).required(),
    year: Joi.number().integer().min(2000).max(2100).required(),
    status: Joi.string().valid("open", "closed").optional(),
  });

  updateAccountingPeriod = Joi.object({
    id: Joi.number().required(),
    status: Joi.string().valid("open", "closed").required(),
  });

  idParam = Joi.object({
    id: Joi.number().required(),
  });
}

export const accountingPeriodsValidation = new AccountingPeriodsValidation();
