import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { AuthController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { registerSchema, loginSchema, updateProfileSchema, updatePasswordSchema, refreshSchema, logoutSchema } from '../validators/auth.validator.js';

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

const logoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many logout attempts. Please wait 1 minute.' },
});

authRouter.post('/register', registerLimiter, validate(registerSchema), AuthController.register);
authRouter.post('/login', loginLimiter, validate(loginSchema), AuthController.login);
authRouter.post('/refresh', refreshLimiter, validate(refreshSchema), AuthController.refresh);

authRouter.get('/me', authMiddleware, AuthController.me);
authRouter.put('/profile', authMiddleware, validate(updateProfileSchema), AuthController.updateProfile);
authRouter.put('/password', authMiddleware, passwordLimiter, validate(updatePasswordSchema), AuthController.updatePassword);

authRouter.post('/logout', authMiddleware, logoutLimiter, validate(logoutSchema), AuthController.logout);

export default authRouter;