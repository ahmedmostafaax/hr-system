import Joi from "joi";

const journalLineSchema = Joi.object({
  account_id: Joi.number().integer().positive().required(),
  debit: Joi.number().min(0).default(0),
  credit: Joi.number().min(0).default(0),
  description: Joi.string().allow("", null).optional(),
  employee_id: Joi.number().integer().positive().allow(null).optional(),
  cost_center_id: Joi.number().integer().positive().allow(null).optional(),
});

class JournalEntriesValidation {
  createJournalEntry = Joi.object({
    entry_type: Joi.string().min(1).max(50).required(),
    description: Joi.string().min(1).required(),
    lines: Joi.array().items(journalLineSchema).min(2).required(),
    payroll_run_id: Joi.number().integer().positive().allow(null).optional(),
    reference_type: Joi.string().max(50).allow(null).optional(),
    reference_id: Joi.number().integer().positive().allow(null).optional(),
    posting_date: Joi.date().optional(),
    status: Joi.string().valid("draft", "posted", "cancelled").optional(),
  });

  updateStatus = Joi.object({
    id: Joi.number().integer().positive().required(),
    status: Joi.string().valid("draft", "posted", "cancelled").required(),
  });

  idParam = Joi.object({
    id: Joi.number().integer().positive().required(),
  });
}

export const journalEntriesValidation = new JournalEntriesValidation();
