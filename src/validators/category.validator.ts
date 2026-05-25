import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(255).trim(),
  icon: z.string().max(255).optional(),
  color: z.string().max(255).optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  icon: z.string().max(255).optional(),
  color: z.string().max(255).optional(),
});
