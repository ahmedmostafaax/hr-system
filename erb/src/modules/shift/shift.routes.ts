import { Router } from 'express';
import { shiftLogic } from './shift.controller';
import { auth } from '../auth/auth.controller';
import { validationMiddleware } from '../../middleware/validation';
import { shiftValidation } from './shift.validation';

const shiftRouter = Router();

shiftRouter.route("/")
.post(auth.protectedRoutes,
    auth.allowedTo("SUPER-ADMIN","ADMIN","HR"),
    validationMiddleware.validate(shiftValidation.createShift),
    shiftLogic.createShift)
.get(auth.protectedRoutes,
    auth.allowedTo("SUPER-ADMIN","ADMIN","HR","ACCOUNTING"),
    shiftLogic.allShift)

shiftRouter.route("/:id")
.get(auth.protectedRoutes,
    auth.allowedTo("SUPER-ADMIN","ADMIN","HR","ACCOUNTING"),
    validationMiddleware.validate(shiftValidation.idParam),
    shiftLogic.singleShift)
.patch(auth.protectedRoutes,
    auth.allowedTo("SUPER-ADMIN","ADMIN","HR"),
    validationMiddleware.validate(shiftValidation.updateShift),
    shiftLogic.updateShift)
.delete(auth.protectedRoutes,
    auth.allowedTo("SUPER-ADMIN","ADMIN","HR"),
    validationMiddleware.validate(shiftValidation.idParam),
    shiftLogic.deleteShift)
export default shiftRouter;