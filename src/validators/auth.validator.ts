import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  email: z.string().email().max(255).trim().toLowerCase(),
  password: z.string().min(8).max(128).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=\[\]])/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  ),
  role: z.enum(['user', 'company']).optional().default('user'),
});

export const loginSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  email: z.string().email().max(255).trim().toLowerCase().optional(),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=\[\]])/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  ),
});

export const refreshSchema = z.object({
  refreshToken: z.string().optional(),
});

export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

export const updateSettingsSchema = z.object({
  currency: z.enum(['BRL', 'USD', 'EUR', 'GBP', 'ARS']),
  locale: z.enum(['pt-BR', 'en-US', 'es-ES']).optional(),
});
