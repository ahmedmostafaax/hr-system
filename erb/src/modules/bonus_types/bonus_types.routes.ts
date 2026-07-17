import { Router } from 'express';
import { bonusTypesController } from './bonus_types.controller';
import { auth } from '../auth/auth.controller';
import { validationMiddleware } from '../../middleware/validation';
import { bonusTypesValidation } from './bonus_types.validation';

const BonusTypesRouter = Router();

BonusTypesRouter.route("/")
.post(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR"),validationMiddleware.validate(bonusTypesValidation.createBonusType),bonusTypesController.createBonusType)
.get(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR","ACCOUNTING"),bonusTypesController.getAllBonusTypes)

BonusTypesRouter.route("/:id")
.get(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR","ACCOUNTING"),validationMiddleware.validate(bonusTypesValidation.idParam),bonusTypesController.singleBonusType)
.patch(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR"),validationMiddleware.validate(bonusTypesValidation.updateBonusType),bonusTypesController.updateBonusType)
.delete(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR"),validationMiddleware.validate(bonusTypesValidation.idParam),bonusTypesController.deleteBonusType)

export default BonusTypesRouter;
