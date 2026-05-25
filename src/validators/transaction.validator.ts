import { z } from 'zod';

export const createTransactionSchema = z.object({
  categoryId: z.string().uuid(),
  description: z.string().min(1).max(255).trim(),
  amount: z.number().int().positive(),
  type: z.enum(['income', 'outcome']),
  date: z.string().datetime().optional(),
});

export const updateTransactionSchema = z.object({
  categoryId: z.string().uuid().optional(),
  description: z.string().min(1).max(255).trim().optional(),
  amount: z.number().int().positive().optional(),
  type: z.enum(['income', 'outcome']).optional(),
  date: z.string().datetime().optional(),
});
