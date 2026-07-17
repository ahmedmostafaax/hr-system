import { Router } from 'express';
import { payrollRunsLogic } from './payroll_runs.controller';
import { auth } from '../auth/auth.controller';
import { validationMiddleware } from '../../middleware/validation';
import { payrollRunsValidation } from './payroll_runs.validation';

const payrollRunsRouter = Router();

payrollRunsRouter.route("/")
.post(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "ACCOUNTING"), validationMiddleware.validate(payrollRunsValidation.createPayrollRun), payrollRunsLogic.createPayrollRun)
.get(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), payrollRunsLogic.allPayrollRuns);

payrollRunsRouter.route("/:id")
.get(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), validationMiddleware.validate(payrollRunsValidation.idParam), payrollRunsLogic.singlePayrollRun)
.patch(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "ACCOUNTING"), validationMiddleware.validate(payrollRunsValidation.updatePayrollRun), payrollRunsLogic.updatePayrollRun)
.delete(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "ACCOUNTING"), validationMiddleware.validate(payrollRunsValidation.idParam), payrollRunsLogic.deletePayrollRun);

payrollRunsRouter.post("/:id/recalculate", auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "ACCOUNTING"), validationMiddleware.validate(payrollRunsValidation.idParam), payrollRunsLogic.recalculatePayroll);

export default payrollRunsRouter;
