import { Router } from 'express';
import { contractLeavesLogic } from './contract_leaves.controller';
import { auth } from '../auth/auth.controller';
import { validationMiddleware } from '../../middleware/validation';
import { contractLeavesValidation } from './contract_leaves.validation';

const contractLeavesRouter = Router();

contractLeavesRouter.route("/")
.post(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(contractLeavesValidation.createContractLeave), contractLeavesLogic.createContractLeave)
.get(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), contractLeavesLogic.allContractLeaves);

contractLeavesRouter.route("/:id")
.get(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), validationMiddleware.validate(contractLeavesValidation.idParam), contractLeavesLogic.singleContractLeave)
.patch(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(contractLeavesValidation.updateContractLeave), contractLeavesLogic.updateContractLeave)
.delete(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(contractLeavesValidation.idParam), contractLeavesLogic.deleteContractLeave);

export default contractLeavesRouter;
