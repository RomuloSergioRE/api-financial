import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(255).trim(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(255).trim(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email().max(255).trim().toLowerCase(),
  role: z.enum(['admin', 'finance', 'viewer']).default('viewer'),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'finance', 'viewer']),
});

export const acceptInviteSchema = z.object({
  status: z.literal('active'),
});

export const fiscalReportQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).default(new Date().getFullYear()),
});
