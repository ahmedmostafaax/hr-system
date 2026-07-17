import { Router } from 'express';
import { insuranceSettingsController } from './insurance_settings.controller';
import { auth } from '../auth/auth.controller';
import { validationMiddleware } from '../../middleware/validation';
import { insuranceSettingsValidation } from './insurance_settings.validation';

const InsuranceSettingsRouter = Router();

InsuranceSettingsRouter.route("/")
.post(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR"),validationMiddleware.validate(insuranceSettingsValidation.createInsuranceSetting),insuranceSettingsController.createInsuranceSetting)
.get(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR","ACCOUNTING"),insuranceSettingsController.getAllInsuranceSettings)

InsuranceSettingsRouter.route("/:id")
.get(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR","ACCOUNTING"),validationMiddleware.validate(insuranceSettingsValidation.idParam),insuranceSettingsController.singleInsuranceSetting)
.patch(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR"),validationMiddleware.validate(insuranceSettingsValidation.updateInsuranceSetting),insuranceSettingsController.updateInsuranceSetting)
.delete(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR"),validationMiddleware.validate(insuranceSettingsValidation.idParam),insuranceSettingsController.deleteInsuranceSetting)

export default InsuranceSettingsRouter;
