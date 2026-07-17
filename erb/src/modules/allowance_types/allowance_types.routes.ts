import { Router } from 'express';
import { allowanceController } from './allowance_types.controller';
import { auth } from '../auth/auth.controller';
import { validationMiddleware } from '../../middleware/validation';
import { allowanceValidation } from './allowance_types.validation';

const allowanceTypeRouter = Router();

allowanceTypeRouter.route("/")
.post(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR"),validationMiddleware.validate(allowanceValidation.createAllowance),allowanceController.create)
.get(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR","ACCOUNTING"),allowanceController.getAll)

allowanceTypeRouter.route("/:id")
.get(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR","ACCOUNTING"),validationMiddleware.validate(allowanceValidation.idParam),allowanceController.single)
.patch(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR"),validationMiddleware.validate(allowanceValidation.updateAllowance),allowanceController.update)
.delete(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR"),validationMiddleware.validate(allowanceValidation.idParam),allowanceController.delete)
export default allowanceTypeRouter;