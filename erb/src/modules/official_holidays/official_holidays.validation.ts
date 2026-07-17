import Joi from "joi";

class OfficialHolidayValidation {
  
  createHoliday = Joi.object({
    name: Joi.string().min(2).max(100).required(),

    start_date: Joi.date().required(),

    days_count: Joi.number().integer().min(1).optional(),
  });

  updateHoliday = Joi.object({
    id: Joi.number().required(),

    name: Joi.string().min(2).max(100).optional(),

    start_date: Joi.date().optional(),

    days_count: Joi.number().integer().min(1).optional(),
  });

  idParam = Joi.object({
    id: Joi.number().required(),
  });

}

export const officialHolidayValidation = new OfficialHolidayValidation();