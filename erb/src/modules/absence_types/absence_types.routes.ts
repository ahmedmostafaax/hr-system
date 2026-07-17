import { Router } from 'express';
import { absenceTypeController } from './absence_types.controller';
import { auth } from '../auth/auth.controller';
import { validationMiddleware } from '../../middleware/validation';
import { absenceTypeValidation } from './absence_types.validation';

const absenceTypeRouter = Router();

absenceTypeRouter.route("/")
.post(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR"),validationMiddleware.validate(absenceTypeValidation.createAbsenceType),absenceTypeController.create)
.get(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR","ACCOUNTING"),absenceTypeController.getAll)

absenceTypeRouter.route("/:id")
.get(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR","ACCOUNTING"),validationMiddleware.validate(absenceTypeValidation.idParam),absenceTypeController.single)
.patch(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR"),validationMiddleware.validate(absenceTypeValidation.updateAbsenceType),absenceTypeController.update)
.delete(auth.protectedRoutes,auth.allowedTo("SUPER-ADMIN","ADMIN","HR"),validationMiddleware.validate(absenceTypeValidation.idParam),absenceTypeController.delete)
export default absenceTypeRouter;