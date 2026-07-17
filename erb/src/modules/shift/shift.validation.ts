import Joi from "joi";

class ShiftValidation {
  createShift = Joi.object({
    name: Joi.string().min(2).max(100).required(),

    type: Joi.string()
      .valid("morning", "evening","between")
      .required(),

    work_days: Joi.array()
      .items(
        Joi.string().valid(
          "sat",
          "sun",
          "mon",
          "tue",
          "wed",
          "thu",
          "fri"
        )
      )
      .required(),

    start_time: Joi.string()
      .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .required(),

    end_time: Joi.string()
      .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .required(),

    grace_minutes: Joi.number().min(0).required(),

    deduct_grace: Joi.boolean().required(),

    salary_basis_days: Joi.number().min(0).required(),
  });

  updateShift = Joi.object({
    id: Joi.number().required(),

    name: Joi.string().min(2).max(100).optional(),

    type: Joi.string().valid("morning", "evening").optional(),

    work_days: Joi.array()
      .items(
        Joi.string().valid(
          "sat",
          "sun",
          "mon",
          "tue",
          "wed",
          "thu",
          "fri"
        )
      )
      .optional(),

    start_time: Joi.string()
      .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .optional(),

    end_time: Joi.string()
      .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .optional(),

    grace_minutes: Joi.number().min(0).optional(),

    deduct_grace: Joi.boolean().optional(),

    salary_basis_days: Joi.number().min(0).optional(),

    is_deleted: Joi.boolean().optional(),
  });

  idParam = Joi.object({
    id: Joi.number().required(),
  });
}

export const shiftValidation = new ShiftValidation();