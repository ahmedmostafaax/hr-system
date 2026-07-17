import { Router } from 'express';
import { officialHolidays } from './official_holidays.controller';
import { auth } from '../auth/auth.controller';
import { validationMiddleware } from '../../middleware/validation';
import { officialHolidayValidation } from './official_holidays.validation';

const officialHolidayRouter = Router();

officialHolidayRouter.route("/")
.post(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR"),validationMiddleware.validate(officialHolidayValidation.createHoliday),officialHolidays.create_official_holidays)
.get(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR","ACCOUNTING"),officialHolidays.all_official_holidays)

officialHolidayRouter.route("/:id")
.get(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR","ACCOUNTING"),validationMiddleware.validate(officialHolidayValidation.idParam),officialHolidays.single_official_holidays)
.patch(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR"),validationMiddleware.validate(officialHolidayValidation.updateHoliday),officialHolidays.update_official_holidays)
.delete(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR"),validationMiddleware.validate(officialHolidayValidation.idParam),officialHolidays.delete_official_holidays)



export default officialHolidayRouter;