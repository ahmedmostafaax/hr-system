import { Router } from 'express';
import { departmentLogic } from './department.controller';
import { auth } from '../auth/auth.controller';
import { validationMiddleware } from '../../middleware/validation';
import { departmentValidation } from './department.validation';

const departmentRouter = Router();

departmentRouter.route("/")
.post(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR" ),validationMiddleware.validate(departmentValidation.createDepartment),departmentLogic.createDepartment)
.get(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR" , "ACCOUNTING"),departmentLogic.allDepartment)

departmentRouter.route("/:id")
.get(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR" , "ACCOUNTING"),validationMiddleware.validate(departmentValidation.idParam),departmentLogic.singleDepartment)
.patch(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR" ),validationMiddleware.validate(departmentValidation.updateDepartment),departmentLogic.updateDepartment)
.delete(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR" ),validationMiddleware.validate(departmentValidation.idParam),departmentLogic.deleteDepartment)

export default departmentRouter;