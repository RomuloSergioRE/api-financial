import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { AuthController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Aguarde 1 minuto.' },
});

authRouter.post('/register', AuthController.register);
authRouter.post('/login', loginLimiter, AuthController.login);
authRouter.post('/refresh', AuthController.refresh);

authRouter.get('/me', authMiddleware, AuthController.me);
authRouter.put('/profile', authMiddleware, AuthController.updateProfile);
authRouter.put('/password', authMiddleware, AuthController.updatePassword);

export default authRouter;