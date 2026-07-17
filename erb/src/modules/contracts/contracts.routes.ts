import { Router } from 'express';
import { contractLogic } from './contracts.controller';
import { auth } from '../auth/auth.controller';
import { validationMiddleware } from '../../middleware/validation';
import { contractValidation } from './contracts.validation';

const contractRouter = Router();

contractRouter.route("/")
.post(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(contractValidation.createContract), contractLogic.createContract)
.get(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), contractLogic.allContracts);

contractRouter.route("/:id")
.get(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), validationMiddleware.validate(contractValidation.idParam), contractLogic.singleContract)
.patch(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(contractValidation.updateContract), contractLogic.updateContract)
.delete(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(contractValidation.idParam), contractLogic.deleteContract);

export default contractRouter;
