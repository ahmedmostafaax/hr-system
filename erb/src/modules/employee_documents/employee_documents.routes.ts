import { Router } from 'express';
import { employeeDocumentLogic } from './employee_documents.controller';
import { auth } from '../auth/auth.controller';
import { validationMiddleware } from '../../middleware/validation';
import { employeeDocumentValidation } from './employee_documents.validation';

const employeeDocumentRouter = Router();

employeeDocumentRouter.route("/")
.post(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(employeeDocumentValidation.createDocument), employeeDocumentLogic.createDocument)
.get(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), employeeDocumentLogic.allDocuments);

employeeDocumentRouter.route("/:id")
.get(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"), validationMiddleware.validate(employeeDocumentValidation.idParam), employeeDocumentLogic.singleDocument)
.patch(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(employeeDocumentValidation.updateDocument), employeeDocumentLogic.updateDocument)
.delete(auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN", "HR"), validationMiddleware.validate(employeeDocumentValidation.idParam), employeeDocumentLogic.deleteDocument);

export default employeeDocumentRouter;
