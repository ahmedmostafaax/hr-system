import { Router } from "express";
import { accountingPeriodsController } from "./accounting_periods.controller";
import { auth } from "../auth/auth.controller";
import { validationMiddleware } from "../../middleware/validation";
import { accountingPeriodsValidation } from "./accounting_periods.validation";

const accountingPeriodsRouter = Router();

accountingPeriodsRouter.route("/")
  .post(
    auth.protectedRoutes,
    auth.allowedTo("SUPER-ADMIN", "ADMIN", "ACCOUNTING"),
    validationMiddleware.validate(
      accountingPeriodsValidation.createAccountingPeriod
    ),
    accountingPeriodsController.createAccountingPeriod
  )
  .get(
    auth.protectedRoutes,
    auth.allowedTo("SUPER-ADMIN", "ADMIN", "ACCOUNTING", "HR"),
    accountingPeriodsController.getAllAccountingPeriods
  );

accountingPeriodsRouter.route("/:id")
  .get(
    auth.protectedRoutes,
    auth.allowedTo("SUPER-ADMIN", "ADMIN", "ACCOUNTING", "HR"),
    validationMiddleware.validate(accountingPeriodsValidation.idParam),
    accountingPeriodsController.getSingleAccountingPeriod
  )
  .patch(
    auth.protectedRoutes,
    auth.allowedTo("SUPER-ADMIN", "ADMIN", "ACCOUNTING"),
    validationMiddleware.validate(
      accountingPeriodsValidation.updateAccountingPeriod
    ),
    accountingPeriodsController.updateAccountingPeriod
  );

export default accountingPeriodsRouter;
