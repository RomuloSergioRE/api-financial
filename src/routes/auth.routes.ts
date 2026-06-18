import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { AuthController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { registerSchema, loginSchema, updateProfileSchema, updatePasswordSchema, refreshSchema, logoutSchema, updateSettingsSchema } from '../validators/auth.validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const avatarDir = path.join(__dirname, '../../uploads/avatars');

if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: avatarDir,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  },
});

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

authRouter.post('/logout', authMiddleware, logoutLimiter, AuthController.logout);
authRouter.post('/avatar', authMiddleware, avatarUpload.single('avatar'), AuthController.uploadAvatar);
authRouter.delete('/avatar', authMiddleware, AuthController.removeAvatar);

authRouter.put('/settings', authMiddleware, validate(updateSettingsSchema), AuthController.updateSettings);

export default authRouter;