import { Router } from 'express';
import { attendanceLogic } from './attendance.controller';
import { auth } from '../auth/auth.controller';
import { validationMiddleware } from '../../middleware/validation';
import { attendanceValidation } from './attendance.validation';

const attendanceRouter = Router();

attendanceRouter.route("/")
.post(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(attendanceValidation.createAttendance), attendanceLogic.createAttendance)
.get(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), attendanceLogic.allAttendance);

attendanceRouter.route("/:id")
.get(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), validationMiddleware.validate(attendanceValidation.idParam), attendanceLogic.singleAttendance)
.patch(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(attendanceValidation.updateAttendance), attendanceLogic.updateAttendance)
.delete(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(attendanceValidation.idParam), attendanceLogic.deleteAttendance);

export default attendanceRouter;
