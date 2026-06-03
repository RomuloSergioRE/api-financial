import { OrganizationRepository } from '../repositories/organization.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { JwtUtil } from '../utils/jwt.util.js';
import { BusinessError } from '../utils/errors.js';
import type { OrganizationInterface, OrgMemberRole } from '../types/organization.types.js';
import type { UserInterface } from '../types/user.types.js';

function assertMember(
  membership: { role: string; userId: string } | null,
  allowedRoles: string[],
  action: string
): asserts membership is { role: string; userId: string } {
  if (!membership) throw new BusinessError('Not a member of this organization', 403);
  if (!allowedRoles.includes(membership.role)) {
    throw new BusinessError(`Insufficient permissions to ${action}`, 403);
  }
}

export const OrganizationService = {
  create: async (userId: string, userRole: string, name: string): Promise<{ organization: OrganizationInterface; token: string }> => {
    if (userRole !== 'company') {
      throw new BusinessError('Only users with role company can create organizations', 403);
    }

    const { organization } = await OrganizationRepository.create(userId, name);
    const token = JwtUtil.generateTokenWithOrg(userId, userRole, organization.id);

    return { organization, token };
  },

  list: async (userId: string): Promise<Array<OrganizationInterface & { role: string; memberCount: number }>> => {
    return OrganizationRepository.findByUser(userId);
  },

  getById: async (orgId: string, userId: string): Promise<OrganizationInterface & { role: string }> => {
    const membership = await OrganizationRepository.findActiveMembership(orgId, userId);
    if (!membership) throw new BusinessError('Not a member of this organization', 403);

    const org = await OrganizationRepository.findById(orgId);
    if (!org) throw new BusinessError('Organization not found', 404);

    return { ...org, role: membership.role };
  },

  select: async (userId: string, userRole: string, orgId: string): Promise<{ organization: OrganizationInterface; token: string }> => {
    const membership = await OrganizationRepository.findActiveMembership(orgId, userId);
    if (!membership) throw new BusinessError('Not an active member of this organization', 403);

    const org = await OrganizationRepository.findById(orgId);
    if (!org) throw new BusinessError('Organization not found', 404);

    const token = JwtUtil.generateTokenWithOrg(userId, userRole, orgId);

    return { organization: org, token };
  },

  update: async (orgId: string, userId: string, data: { name: string }): Promise<OrganizationInterface> => {
    const membership = await OrganizationRepository.findMembership(orgId, userId);
    assertMember(membership, ['admin'], 'update organization');

    const org = await OrganizationRepository.update(orgId, data);
    if (!org) throw new BusinessError('Organization not found', 404);

    return org;
  },

  delete: async (orgId: string, userId: string): Promise<void> => {
    const membership = await OrganizationRepository.findMembership(orgId, userId);
    assertMember(membership, ['admin'], 'delete organization');

    const org = await OrganizationRepository.findById(orgId);
    if (!org) throw new BusinessError('Organization not found', 404);

    if (org.ownerId !== userId) {
      throw new BusinessError('Only the owner can delete the organization', 403);
    }

    await OrganizationRepository.delete(orgId);
  },

  listMembers: async (orgId: string, userId: string): Promise<Array<{
    id: string; userId: string; email: string; name: string; role: string; status: string; createdAt: Date;
  }>> => {
    const membership = await OrganizationRepository.findActiveMembership(orgId, userId);
    if (!membership) throw new BusinessError('Not a member of this organization', 403);

    return OrganizationRepository.findMembers(orgId);
  },

  inviteMember: async (orgId: string, inviterId: string, email: string, role: OrgMemberRole): Promise<{ id: string; userId: string; role: string; status: string }> => {
    const membership = await OrganizationRepository.findActiveMembership(orgId, inviterId);
    assertMember(membership, ['admin'], 'invite members');

    const invitedUser = await UserRepository.findByEmail(email);
    if (!invitedUser) throw new BusinessError('User with this email not found', 404);

    if (invitedUser.id === inviterId) {
      throw new BusinessError('Cannot invite yourself', 400);
    }

    const result = await OrganizationRepository.addMember(orgId, invitedUser.id, role, inviterId);
    if (!result) throw new BusinessError('User is already a member of this organization', 409);

    return {
      id: result.id,
      userId: result.userId,
      role: result.role,
      status: result.status,
    };
  },

  acceptInvite: async (orgId: string, userId: string): Promise<{ role: string; status: string }> => {
    const membership = await OrganizationRepository.findMembership(orgId, userId);
    if (!membership) throw new BusinessError('No invitation found for this organization', 404);
    if (membership.status === 'active') throw new BusinessError('Already a member', 400);

    const updated = await OrganizationRepository.updateMemberStatus(orgId, userId, 'active');
    if (!updated) throw new BusinessError('Could not accept invitation', 500);

    return { role: updated.role, status: updated.status };
  },

  updateMemberRole: async (orgId: string, requesterId: string, targetUserId: string, role: OrgMemberRole): Promise<{ role: string }> => {
    const membership = await OrganizationRepository.findMembership(orgId, requesterId);
    assertMember(membership, ['admin'], 'change member roles');

    const org = await OrganizationRepository.findById(orgId);
    if (!org) throw new BusinessError('Organization not found', 404);

    if (targetUserId === org.ownerId && role !== 'admin') {
      throw new BusinessError('Cannot demote the owner below admin', 400);
    }

    const updated = await OrganizationRepository.updateMemberRole(orgId, targetUserId, role);
    if (!updated) throw new BusinessError('Member not found', 404);

    return { role: updated.role };
  },

  removeMember: async (orgId: string, requesterId: string, targetUserId: string): Promise<void> => {
    const membership = await OrganizationRepository.findMembership(orgId, requesterId);
    assertMember(membership, ['admin'], 'remove members');

    const org = await OrganizationRepository.findById(orgId);
    if (!org) throw new BusinessError('Organization not found', 404);

    if (targetUserId === org.ownerId) {
      throw new BusinessError('Cannot remove the owner', 400);
    }

    if (targetUserId === requesterId) {
      throw new BusinessError('Cannot remove yourself', 400);
    }

    const removed = await OrganizationRepository.removeMember(orgId, targetUserId);
    if (!removed) throw new BusinessError('Member not found', 404);
  },

  getFiscalReport: async (orgId: string, userId: string, year: number): Promise<Array<{ month: number; categoryName: string; total: number }>> => {
    const membership = await OrganizationRepository.findActiveMembership(orgId, userId);
    if (!membership) throw new BusinessError('Not a member of this organization', 403);

    if (membership.role === 'viewer') {
      throw new BusinessError('Viewers cannot access fiscal reports', 403);
    }

    return OrganizationRepository.getFiscalReport(orgId, year);
  },

  clearContext: async (userId: string, userRole: string): Promise<string> => {
    return JwtUtil.generateTokenWithoutOrg(userId, userRole);
  },
};
