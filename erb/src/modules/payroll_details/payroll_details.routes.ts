import { Router } from 'express';
import { payrollDetailsController } from './payroll_details.controller';
import { auth } from '../auth/auth.controller';
import { validationMiddleware } from '../../middleware/validation';

const payrollDetailsRouter = Router();



payrollDetailsRouter.route("/:id")
  .get(
    auth.protectedRoutes,
    auth.allowedTo("SUPER-ADMIN", "ADMIN", "ACCOUNTING"),
    payrollDetailsController.getPayrollByRunId
  );

  payrollDetailsRouter.route("/:employee_id/:payroll_run_id")
  .get(
    auth.protectedRoutes,
    auth.allowedTo("SUPER-ADMIN", "ADMIN", "ACCOUNTING"),
    payrollDetailsController.getEmployeePayroll
  );


export default payrollDetailsRouter;
