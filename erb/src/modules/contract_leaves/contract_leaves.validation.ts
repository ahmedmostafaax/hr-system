import Joi from "joi";

export const contractLeavesValidation = {
  createContractLeave: Joi.object({
    contract_id: Joi.number().required(),
    leave_type_id: Joi.number().required(),
    used_days: Joi.number().optional().default(0),
    year: Joi.number().required(),
  }),

  updateContractLeave: Joi.object({
    id: Joi.number().required(),

    contract_id: Joi.number().optional(),
    leave_type_id: Joi.number().optional(),
    used_days: Joi.number().optional(),
    year: Joi.number().optional(),
  }),

  idParam: Joi.object({
    id: Joi.number().required(),
  }),
};
