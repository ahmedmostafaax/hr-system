import { Router } from 'express';
import { employeeLoansLogic } from './employee_loans.controller';
import { auth } from '../auth/auth.controller';
import { validationMiddleware } from '../../middleware/validation';
import { employeeLoansValidation } from './employee_loans.validation';

const employeeLoansRouter = Router();

employeeLoansRouter.route("/")
.post(auth.protectedRoutes, auth.allowedToOrLinkedEmployee("SUPER-ADMIN", "ADMIN", "HR", "EMPLOYEE"), validationMiddleware.validate(employeeLoansValidation.createLoan), employeeLoansLogic.createLoan)
.get(auth.protectedRoutes, auth.allowedToOrLinkedEmployee("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING", "EMPLOYEE"), employeeLoansLogic.allLoans);

employeeLoansRouter.route("/:id")
.get(auth.protectedRoutes, auth.allowedToOrLinkedEmployee("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING", "EMPLOYEE"), validationMiddleware.validate(employeeLoansValidation.idParam), employeeLoansLogic.singleLoan)
.patch(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), validationMiddleware.validate(employeeLoansValidation.updateLoan), employeeLoansLogic.updateLoan)
.delete(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(employeeLoansValidation.idParam), employeeLoansLogic.deleteLoan);

export default employeeLoansRouter;
