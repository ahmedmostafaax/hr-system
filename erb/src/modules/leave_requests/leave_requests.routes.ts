import { Router } from 'express';
import { leaveRequestsLogic } from './leave_requests.controller';
import { auth } from '../auth/auth.controller';
import { validationMiddleware } from '../../middleware/validation';
import { leaveRequestsValidation } from './leave_requests.validation';

const leaveRequestsRouter = Router();

leaveRequestsRouter.route("/")
.post(auth.protectedRoutes, auth.allowedToOrLinkedEmployee("SUPER-ADMIN", "ADMIN", "HR", "EMPLOYEE"), validationMiddleware.validate(leaveRequestsValidation.createLeaveRequest), leaveRequestsLogic.createLeaveRequest)
.get(auth.protectedRoutes, auth.allowedToOrLinkedEmployee("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING", "EMPLOYEE"), leaveRequestsLogic.allLeaveRequests);

leaveRequestsRouter.route("/:id")
.get(auth.protectedRoutes, auth.allowedToOrLinkedEmployee("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING", "EMPLOYEE"), validationMiddleware.validate(leaveRequestsValidation.idParam), leaveRequestsLogic.singleLeaveRequest)
.patch(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(leaveRequestsValidation.updateLeaveRequest), leaveRequestsLogic.updateLeaveRequest)
.delete(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(leaveRequestsValidation.idParam), leaveRequestsLogic.deleteLeaveRequest);

export default leaveRequestsRouter;
