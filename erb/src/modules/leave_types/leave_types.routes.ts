import { Router } from 'express';
import { leaveTypes } from './leave_types.controller';
import { auth } from '../auth/auth.controller';
import { validationMiddleware } from '../../middleware/validation';
import { leaveTypeValidation } from './leave_types.validation';

const leaveTypesRouter = Router();

leaveTypesRouter.route("/")
.post(auth.protectedRoutes , auth.allowedTo("SUPER-ADMIN","ADMIN","HR"),validationMiddleware.validate(leaveTypeValidation.createLeaveType), leaveTypes.create)
.get(auth.protectedRoutes , auth.allowedTo("SUPER-ADMIN","ADMIN","HR","ACCOUNTING","EMPLOYEE"),leaveTypes.allLeaveType)

leaveTypesRouter.route("/:id")
.get(auth.protectedRoutes , auth.allowedTo("SUPER-ADMIN","ADMIN","HR","ACCOUNTING"),validationMiddleware.validate(leaveTypeValidation.idParam),leaveTypes.singleLeaveType)
.patch(auth.protectedRoutes , auth.allowedTo("SUPER-ADMIN","ADMIN","HR"),validationMiddleware.validate(leaveTypeValidation.updateLeaveType),leaveTypes.updateLeaveType)
.delete(auth.protectedRoutes , auth.allowedTo("SUPER-ADMIN","ADMIN","HR"),validationMiddleware.validate(leaveTypeValidation.idParam),leaveTypes.deleteLeaveType)

export default leaveTypesRouter;