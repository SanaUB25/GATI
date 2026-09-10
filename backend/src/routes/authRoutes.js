import { Router } from 'express';
import { body } from 'express-validator';
import { loginController } from '../controllers/authController.js';
import { validateRequest } from '../middleware/validateRequest.js';

export const authRoutes = Router();
authRoutes.post('/login', [body('email').isEmail(), body('password').isString().isLength({ min: 8 })], validateRequest, loginController);
