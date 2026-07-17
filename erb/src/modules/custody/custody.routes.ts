import { Router } from 'express';
import { custodyLogic } from './custody.controller';
import { auth } from '../auth/auth.controller';
import { validationMiddleware } from '../../middleware/validation';
import { custodyValidation } from './custody.validation';

const custodyRouter = Router();

custodyRouter.route("/")
  .post(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(custodyValidation.createCustody), custodyLogic.createCustody)
  .get(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), custodyLogic.allCustodies);

custodyRouter.route("/:id")
  .get(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), validationMiddleware.validate(custodyValidation.idParam), custodyLogic.singleCustody)
  .patch(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(custodyValidation.updateCustody), custodyLogic.updateCustody)
  .delete(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(custodyValidation.idParam), custodyLogic.deleteCustody);

export default custodyRouter;
