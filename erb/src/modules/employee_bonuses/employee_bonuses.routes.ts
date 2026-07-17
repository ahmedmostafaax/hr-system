import { Router } from 'express';
import { employeeBonusesLogic } from './employee_bonuses.controller';
import { auth } from '../auth/auth.controller';
import { validationMiddleware } from '../../middleware/validation';
import { employeeBonusesValidation } from './employee_bonuses.validation';

const employeeBonusesRouter = Router();

employeeBonusesRouter.route("/")
.post(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(employeeBonusesValidation.createBonus), employeeBonusesLogic.createBonus)
.get(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), employeeBonusesLogic.allBonuses);

employeeBonusesRouter.route("/:id")
.get(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), validationMiddleware.validate(employeeBonusesValidation.idParam), employeeBonusesLogic.singleBonus)
.patch(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), validationMiddleware.validate(employeeBonusesValidation.updateBonus), employeeBonusesLogic.updateBonus)
.delete(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(employeeBonusesValidation.idParam), employeeBonusesLogic.deleteBonus);

export default employeeBonusesRouter;
