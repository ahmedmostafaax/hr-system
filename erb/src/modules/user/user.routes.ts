import { Router } from 'express';
import { userController } from './user.controller';
import { validationMiddleware } from '../../middleware/validation';
import { userValidation } from './user.validation';
import { auth } from '../auth/auth.controller';

const userRoute = Router();

userRoute.post('/', auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN"), validationMiddleware.validate(userValidation.createUser) , userController.createUser);
userRoute.get('/', auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN"), userController.getAllUsers);
userRoute.get('/:id', auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN"), validationMiddleware.validate(userValidation.getUserById) ,userController.getSingleUser);
userRoute.post('/:id/resetPassword', auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN"), validationMiddleware.validate(userValidation.getUserById), userController.resetPassword);
userRoute.patch('/:id', auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN"), validationMiddleware.validate(userValidation.updateUser), userController.updateUser);
userRoute.delete('/:id', auth.protectedRoutes, auth.allowedTo("SUPER-ADMIN", "ADMIN"), validationMiddleware.validate(userValidation.getUserById) ,userController.deleteUser);



export default userRoute;