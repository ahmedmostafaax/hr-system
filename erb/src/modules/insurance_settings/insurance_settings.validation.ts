import Joi from "joi";

class InsuranceSettingsValidation {
  createInsuranceSetting = Joi.object({
    employee_rate: Joi.number().min(0).max(100).required(),
    company_rate: Joi.number().min(0).max(100).required(),
    effective_from: Joi.date().iso().required(),
  });

  updateInsuranceSetting = Joi.object({
    id: Joi.number().required(),

    employee_rate: Joi.number().min(0).max(100).optional(),
    company_rate: Joi.number().min(0).max(100).optional(),
    effective_from: Joi.date().iso().optional(),
  }).min(2);

  idParam = Joi.object({
    id: Joi.number().required(),
  });
}

export const insuranceSettingsValidation = new InsuranceSettingsValidation();
