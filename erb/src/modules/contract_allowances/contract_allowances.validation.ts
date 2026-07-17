import Joi from "joi";

class ContractAllowancesValidation {
  createContractAllowance = Joi.object({
    contract_id: Joi.number().required(),
    allowance_type_id: Joi.number().required(),
        amount: Joi.number().positive().optional(),

  });

  updateContractAllowance = Joi.object({
    id: Joi.number().required(),
    contract_id: Joi.number().optional(),
    allowance_type_id: Joi.number().optional(),
    amount: Joi.number().positive().optional(),
    is_deleted: Joi.boolean().optional(),
  });

  idParam = Joi.object({
    id: Joi.number().required(),
  });
}

export const contractAllowancesValidation = new ContractAllowancesValidation();
