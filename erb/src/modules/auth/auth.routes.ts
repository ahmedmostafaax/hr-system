import { Router } from 'express';
import  { auth } from './auth.controller';
import { validationMiddleware } from '../../middleware/validation';
import { authValidation } from './auth.validation';


const authRouter = Router();

authRouter.post('/login',validationMiddleware.validate(authValidation.signin), auth.signin);
authRouter.post('/forgetPassword', validationMiddleware.validate(authValidation.forgetPassword),auth.forgetPassword);
authRouter.post('/verifyResetCode',validationMiddleware.validate(authValidation.verifyCode), auth.verifyResetCode);
authRouter.patch('/resetPassword',validationMiddleware.validate(authValidation.resetPassword), auth.resetPassword);
authRouter.patch('/changePassword',auth.protectedRoutes, validationMiddleware.validate(authValidation.changePassword), auth.changePassword);
authRouter.post('/logout', auth.protectedRoutes, auth.logout);



export default authRouter;