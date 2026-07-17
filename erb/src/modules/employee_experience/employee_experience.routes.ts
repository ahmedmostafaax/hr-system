import { Router } from 'express';
import { employeeExperienceLogic } from './employee_experience.controller';
import { auth } from '../auth/auth.controller';
import { validationMiddleware } from '../../middleware/validation';
import { employeeExperienceValidation } from './employee_experience.validation';

const employeeExperienceRouter = Router();

employeeExperienceRouter.route("/")
.post(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(employeeExperienceValidation.createExperience), employeeExperienceLogic.createExperience)
.get(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), employeeExperienceLogic.allExperiences);

employeeExperienceRouter.route("/:id")
.get(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), validationMiddleware.validate(employeeExperienceValidation.idParam), employeeExperienceLogic.singleExperience)
.patch(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(employeeExperienceValidation.updateExperience), employeeExperienceLogic.updateExperience)
.delete(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(employeeExperienceValidation.idParam), employeeExperienceLogic.deleteExperience);

export default employeeExperienceRouter;
