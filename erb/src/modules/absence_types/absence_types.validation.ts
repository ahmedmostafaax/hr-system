import Joi from "joi";

class AbsenceTypeValidation {
  createAbsenceType = Joi.object({
    name: Joi.string().min(2).max(100).required(),

    deduct_days: Joi.number()
      .min(0)
      .max(30)
      .precision(1)
      .required(),

    requires_permission: Joi.boolean().optional(),
  });

  updateAbsenceType = Joi.object({
        id: Joi.number().required(),

    name: Joi.string().min(2).max(100).optional(),

    deduct_days: Joi.number()
      .min(0)
      .max(30)
      .precision(1)
      .optional(),

    requires_permission: Joi.boolean().optional(),
  }).min(1);

  idParam = Joi.object({
    id: Joi.number().required(),
  });
}

export const absenceTypeValidation = new AbsenceTypeValidation();