import { z } from 'zod';

export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended']),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['admin', 'user', 'company']),
});

export const createGlobalCategorySchema = z.object({
  name: z.string().min(1).max(255).trim(),
  icon: z.string().max(255).optional(),
  color: z.string().max(255).optional(),
});

export const updateGlobalCategorySchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  icon: z.string().max(255).optional(),
  color: z.string().max(255).optional(),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(['admin', 'user', 'company']).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  search: z.string().max(255).optional(),
});
