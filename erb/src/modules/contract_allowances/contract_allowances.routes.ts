import { Router } from 'express';
import { contractAllowancesLogic } from './contract_allowances.controller';
import { auth } from '../auth/auth.controller';
import { validationMiddleware } from '../../middleware/validation';
import { contractAllowancesValidation } from './contract_allowances.validation';

const contractAllowancesRouter = Router();

contractAllowancesRouter.route("/")
.post(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(contractAllowancesValidation.createContractAllowance), contractAllowancesLogic.createContractAllowance)
.get(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), contractAllowancesLogic.allContractAllowances);

contractAllowancesRouter.route("/:id")
.get(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), validationMiddleware.validate(contractAllowancesValidation.idParam), contractAllowancesLogic.singleContractAllowance)
.patch(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(contractAllowancesValidation.updateContractAllowance), contractAllowancesLogic.updateContractAllowance)
.delete(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(contractAllowancesValidation.idParam), contractAllowancesLogic.deleteContractAllowance);

export default contractAllowancesRouter;
