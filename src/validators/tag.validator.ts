import { z } from 'zod';

export const createTagSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  color: z.string().max(255).optional(),
});

export const updateTagSchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  color: z.string().max(255).optional(),
});

export const linkTagsSchema = z.object({
  tagIds: z.array(z.string().uuid()).min(1, 'At least one tagId is required'),
});
