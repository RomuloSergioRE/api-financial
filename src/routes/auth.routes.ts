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
  message: { error: 'Too many login attempts. Please wait 1 minute.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many registration attempts. Please wait 1 minute.' },
});

const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many refresh attempts. Please wait 1 minute.' },
});

const passwordLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many password change attempts. Please wait 1 minute.' },
});

authRouter.post('/register', registerLimiter, AuthController.register);
authRouter.post('/login', loginLimiter, AuthController.login);
authRouter.post('/refresh', refreshLimiter, AuthController.refresh);

authRouter.get('/me', authMiddleware, AuthController.me);
authRouter.put('/profile', authMiddleware, AuthController.updateProfile);
authRouter.put('/password', authMiddleware, passwordLimiter, AuthController.updatePassword);

export default authRouter;