import { Op } from 'sequelize';
import OrganizationMember from '../models/organization-member.model.js';

export async function resolveOrgMemberIds(orgId: string): Promise<string[]> {
  const members = await OrganizationMember.findAll({
    where: { organizationId: orgId, status: 'active' },
    attributes: ['userId'],
    raw: true,
  });
  return members.map(m => m.userId);
}
