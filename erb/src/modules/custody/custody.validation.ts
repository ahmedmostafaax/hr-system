import Joi from "joi";

export const custodyValidation = {
  createCustody: Joi.object({
    from_employee_id: Joi.number().optional().allow(null),
    to_employee_id: Joi.number().required(),
    item_name: Joi.string().required(),
    transfer_type: Joi.string().valid("handover", "receive", "transfer").required(),
    transfer_date: Joi.date().required(),
    notes: Joi.string().optional().allow(null, ""),
  }),

  updateCustody: Joi.object({
    id: Joi.number().required(),

    from_employee_id: Joi.number().optional().allow(null),
    to_employee_id: Joi.number().optional(),
    item_name: Joi.string().optional(),
    transfer_type: Joi.string().valid("handover", "receive", "transfer").optional(),
    transfer_date: Joi.date().optional(),
    notes: Joi.string().optional().allow(null, ""),
  }),

  idParam: Joi.object({
    id: Joi.number().required(),
  }),
};
