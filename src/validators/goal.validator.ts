import { z } from 'zod';

export const createGoalSchema = z.object({
  categoryId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(255),
  targetAmount: z.number().int().positive(),
  deadline: z.string().date().nullable().optional(),
});

export const updateGoalSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  targetAmount: z.number().int().positive().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  deadline: z.string().date().nullable().optional(),
});
