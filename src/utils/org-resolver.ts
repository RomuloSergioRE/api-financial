import { Op } from 'sequelize';
import OrganizationMember from '../models/organization-member.model.js';
import type { OrgContext } from '../types/organization.types.js';

const cache = new Map<string, { memberIds: string[]; expiry: number }>();
const CACHE_TTL_MS = 5_000;

export async function resolveOrgMemberIds(orgId: string): Promise<string[]> {
  const cached = cache.get(orgId);
  if (cached && cached.expiry > Date.now()) {
    return cached.memberIds;
  }

  const members = await OrganizationMember.findAll({
    where: { organizationId: orgId, status: 'active' },
    attributes: ['userId'],
    raw: true,
  });

  const memberIds = members.map(m => m.userId);
  cache.set(orgId, { memberIds, expiry: Date.now() + CACHE_TTL_MS });
  return memberIds;
}

export async function resolveOrgContext(orgId: string): Promise<OrgContext> {
  const memberIds = await resolveOrgMemberIds(orgId);
  return { memberIds, orgId };
}
