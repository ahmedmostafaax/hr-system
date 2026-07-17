import { Router } from 'express';
import { absencesLogic } from './absences.controller';
import { auth } from '../auth/auth.controller';
import { validationMiddleware } from '../../middleware/validation';
import { absencesValidation } from './absences.validation';

const absencesRouter = Router();

absencesRouter.route("/")
.post(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(absencesValidation.createAbsence), absencesLogic.createAbsence)
.get(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), absencesLogic.allAbsences);

absencesRouter.route("/:id")
.get(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), validationMiddleware.validate(absencesValidation.idParam), absencesLogic.singleAbsence)
.patch(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(absencesValidation.updateAbsence), absencesLogic.updateAbsence)
.delete(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(absencesValidation.idParam), absencesLogic.deleteAbsence);

export default absencesRouter;
