import { z } from 'zod';

export const createBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  limit: z.number().int().positive(),
});

export const updateBudgetSchema = z.object({
  limit: z.number().int().positive().optional(),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  categoryId: z.string().uuid().optional(),
});
