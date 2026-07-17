import { Router } from 'express';
import { account } from './account.controller';
import { auth } from '../auth/auth.controller';
import { validationMiddleware } from '../../middleware/validation';
import { accountValidation } from './account.validation';

const AccountRouter = Router();

AccountRouter.route("/")
.post(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR"),validationMiddleware.validate(accountValidation.createAccount),account.createAccount)
.get(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR","ACCOUNTING"),account.getAllAccounts)

AccountRouter.route("/:id")
.get(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR","ACCOUNTING"),validationMiddleware.validate(accountValidation.idParam),account.singleAccount)
.patch(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR"),validationMiddleware.validate(accountValidation.updateAccount),account.updateAccount)
.delete(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR"),validationMiddleware.validate(accountValidation.idParam),account.deleteAccount)

export default AccountRouter;