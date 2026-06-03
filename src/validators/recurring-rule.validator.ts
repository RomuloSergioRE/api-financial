import { z } from 'zod';

export const createRecurringRuleSchema = z.object({
  categoryId: z.string().uuid(),
  description: z.string().min(1).max(255),
  amount: z.number().int().positive(),
  type: z.enum(['income', 'outcome']),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.number().int().positive().default(1),
  nextDate: z.string().date(),
  endDate: z.string().date().nullable().optional(),
});

export const updateRecurringRuleSchema = z.object({
  categoryId: z.string().uuid().optional(),
  description: z.string().min(1).max(255).optional(),
  amount: z.number().int().positive().optional(),
  type: z.enum(['income', 'outcome']).optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  interval: z.number().int().positive().optional(),
  nextDate: z.string().date().optional(),
  endDate: z.string().date().nullable().optional(),
  active: z.boolean().optional(),
});
