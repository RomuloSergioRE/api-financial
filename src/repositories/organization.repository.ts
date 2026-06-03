import { Op, fn, col, literal } from 'sequelize';
import { Organization, OrganizationMember, User, Transaction, Category } from '../models/index.js';
import type { OrganizationInterface, OrganizationMemberInterface, OrgMemberRole, OrgMemberStatus } from '../types/organization.types.js';

interface Pagination {
  offset: number;
  limit: number;
}

export const OrganizationRepository = {
  create: async (ownerId: string, name: string): Promise<{ organization: OrganizationInterface; membership: OrganizationMemberInterface }> => {
    const organization = await Organization.create({ name, ownerId });
    const membership = await OrganizationMember.create({
      organizationId: organization.id,
      userId: ownerId,
      role: 'admin' as OrgMemberRole,
      status: 'active' as OrgMemberStatus,
      invitedBy: ownerId,
    });
    return {
      organization: organization.dataValues as OrganizationInterface,
      membership: membership.dataValues as OrganizationMemberInterface,
    };
  },

  findByUser: async (userId: string): Promise<Array<OrganizationInterface & { role: string; memberCount: number }>> => {
    const memberships = await OrganizationMember.findAll({
      where: { userId, status: 'active' },
      attributes: ['role', 'organizationId'],
      raw: true,
    });

    if (memberships.length === 0) return [];

    const orgIds = memberships.map(m => m.organizationId);
    const orgRoleMap = new Map(memberships.map(m => [m.organizationId, m.role]));

    const orgs = await Organization.findAll({
      where: { id: { [Op.in]: orgIds } },
      raw: true,
    });

    const memberCounts = await OrganizationMember.findAll({
      where: { organizationId: { [Op.in]: orgIds }, status: 'active' },
      attributes: ['organizationId', [fn('COUNT', col('id')), 'count']],
      group: ['organizationId'],
      raw: true,
    });

    const countMap = new Map(
      (memberCounts as unknown as Array<{ organizationId: string; count: string }>).map(m => [m.organizationId, Number(m.count)])
    );

    return (orgs as OrganizationInterface[]).map(o => ({
      ...o,
      role: orgRoleMap.get(o.id) || 'viewer',
      memberCount: countMap.get(o.id) || 1,
    }));
  },

  findById: async (id: string): Promise<OrganizationInterface | null> => {
    const orgRecord = await Organization.findByPk(id);
    return orgRecord ? (orgRecord.dataValues as OrganizationInterface) : null;
  },

  findMembership: async (orgId: string, userId: string): Promise<OrganizationMemberInterface | null> => {
    const member = await OrganizationMember.findOne({
      where: { organizationId: orgId, userId },
    });
    return member ? (member.dataValues as OrganizationMemberInterface) : null;
  },

  findActiveMembership: async (orgId: string, userId: string): Promise<OrganizationMemberInterface | null> => {
    const member = await OrganizationMember.findOne({
      where: { organizationId: orgId, userId, status: 'active' },
    });
    return member ? (member.dataValues as OrganizationMemberInterface) : null;
  },

  update: async (id: string, data: { name: string }): Promise<OrganizationInterface | null> => {
    const [affectedCount, affectedRows] = await Organization.update(data, {
      where: { id },
      returning: true,
    });
    if (affectedCount === 0 || !affectedRows[0]) return null;
    return affectedRows[0].dataValues as OrganizationInterface;
  },

  delete: async (id: string): Promise<boolean> => {
    const deleted = await Organization.destroy({ where: { id } });
    return deleted > 0;
  },

  findMembers: async (orgId: string): Promise<Array<{
    id: string;
    userId: string;
    email: string;
    name: string;
    role: string;
    status: string;
    createdAt: Date;
  }>> => {
    const members = await OrganizationMember.findAll({
      where: { organizationId: orgId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['email', 'name'],
      }],
      order: [['createdAt', 'ASC']],
    });

    return members.map(m => ({
      id: m.dataValues.id,
      userId: m.dataValues.userId,
      email: (m.dataValues as any).user?.email || '',
      name: (m.dataValues as any).user?.name || '',
      role: m.dataValues.role,
      status: m.dataValues.status,
      createdAt: m.dataValues.createdAt,
    }));
  },

  addMember: async (
    orgId: string,
    userId: string,
    role: OrgMemberRole,
    invitedBy: string
  ): Promise<OrganizationMemberInterface | null> => {
    const existing = await OrganizationMember.findOne({
      where: { organizationId: orgId, userId },
    });
    if (existing) {
      if (existing.dataValues.status === 'pending') {
        existing.dataValues.role = role;
        existing.dataValues.invitedBy = invitedBy;
        await existing.save();
        return existing.dataValues as OrganizationMemberInterface;
      }
      return null;
    }

    const member = await OrganizationMember.create({
      organizationId: orgId,
      userId,
      role,
      status: 'pending' as OrgMemberStatus,
      invitedBy,
    });
    return member.dataValues as OrganizationMemberInterface;
  },

  updateMemberRole: async (orgId: string, userId: string, role: OrgMemberRole): Promise<OrganizationMemberInterface | null> => {
    const member = await OrganizationMember.findOne({
      where: { organizationId: orgId, userId },
    });
    if (!member) return null;
    member.role = role;
    await member.save();
    return member.dataValues as OrganizationMemberInterface;
  },

  updateMemberStatus: async (orgId: string, userId: string, status: OrgMemberStatus): Promise<OrganizationMemberInterface | null> => {
    const member = await OrganizationMember.findOne({
      where: { organizationId: orgId, userId },
    });
    if (!member) return null;
    member.status = status;
    await member.save();
    return member.dataValues as OrganizationMemberInterface;
  },

  removeMember: async (orgId: string, userId: string): Promise<boolean> => {
    const deleted = await OrganizationMember.destroy({
      where: { organizationId: orgId, userId },
    });
    return deleted > 0;
  },

  countByUser: async (userId: string): Promise<number> => {
    return OrganizationMember.count({ where: { userId, status: 'active' } });
  },

  getFiscalReport: async (orgId: string, year: number): Promise<Array<{ month: number; categoryName: string; total: number }>> => {
    const results = await Transaction.findAll({
      where: {
        organizationId: orgId,
        type: 'outcome',
        [Op.and]: literal(`EXTRACT(YEAR FROM "Transaction"."date") = ${year}`),
      },
      attributes: [
        [fn('DATE_TRUNC', 'month', col('Transaction.date')), 'monthDate'],
        [col('category.name'), 'categoryName'],
        [fn('SUM', col('Transaction.amount')), 'total'],
      ],
      include: [{
        model: Category,
        as: 'category',
        attributes: [],
      }],
      group: [fn('DATE_TRUNC', 'month', col('Transaction.date')), col('category.name')],
      order: [[fn('DATE_TRUNC', 'month', col('Transaction.date')), 'ASC'], [fn('SUM', col('Transaction.amount')), 'DESC']],
      raw: true,
    });

    const mapped = (results as unknown as Array<{ monthDate: string; categoryName: string; total: number }>)
      .map(r => ({
        month: new Date(r.monthDate).getMonth() + 1,
        categoryName: r.categoryName,
        total: r.total,
      }));

    return mapped;
  },
};
