import { Router } from 'express';
import { employeeLogic } from './employee.controller';
import { auth } from '../auth/auth.controller';
import { validationMiddleware } from '../../middleware/validation';
import { employeeValidation } from './employees.validation';

const employeeRouter = Router();

employeeRouter.route("/me/summary")
.get(auth.protectedRoutes, auth.allowedToOrLinkedEmployee("EMPLOYEE"), employeeLogic.myEmployeeSummary);

employeeRouter.route("/me")
.get(auth.protectedRoutes, auth.allowedToOrLinkedEmployee("EMPLOYEE"), employeeLogic.myEmployee);

employeeRouter.route("/")
.post(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(employeeValidation.createEmployee), employeeLogic.createEmployee)
.get(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), employeeLogic.allEmployee);

employeeRouter.route("/:id/create-user-account")
.post(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(employeeValidation.idParam), employeeLogic.createEmployeeUserAccount);

employeeRouter.route("/:id/reset-user-password")
.post(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(employeeValidation.idParam), employeeLogic.resetEmployeeUserPassword);

employeeRouter.route("/:id")
.get(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), validationMiddleware.validate(employeeValidation.idParam), employeeLogic.singleEmployee)
.patch(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(employeeValidation.updateEmployee), employeeLogic.updateEmployee)
.delete(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(employeeValidation.idParam), employeeLogic.deleteEmployee);

export default employeeRouter;
