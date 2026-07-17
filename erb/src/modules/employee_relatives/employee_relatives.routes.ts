import { Router } from 'express';
import { employeeRelativeLogic } from './employee_relatives.controller';
import { auth } from '../auth/auth.controller';
import { validationMiddleware } from '../../middleware/validation';
import { employeeRelativeValidation } from './employee_relatives.validation';

const employeeRelativeRouter = Router();

employeeRelativeRouter.route("/")
.post(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(employeeRelativeValidation.createRelative), employeeRelativeLogic.createRelative)
.get(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), employeeRelativeLogic.allRelatives);

employeeRelativeRouter.route("/:id")
.get(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), validationMiddleware.validate(employeeRelativeValidation.idParam), employeeRelativeLogic.singleRelative)
.patch(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(employeeRelativeValidation.updateRelative), employeeRelativeLogic.updateRelative)
.delete(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(employeeRelativeValidation.idParam), employeeRelativeLogic.deleteRelative);

export default employeeRelativeRouter;
