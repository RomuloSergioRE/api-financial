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

export const transactionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categoryId: z.string().uuid().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional(),
  search: z.string().max(255).optional(),
  tags: z.string().max(1000).optional(),
});
