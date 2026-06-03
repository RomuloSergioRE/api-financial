import { Op } from 'sequelize';
import Goal from '../models/goal.model.js';
import Category from '../models/category.model.js';
import type { GoalInterface, GoalCreateInput, GoalUpdateInput } from '../types/goal.types.js';

interface OrgContext {
  memberIds: string[];
  orgId: string;
}

export const GoalRepository = {
  create: async (userId: string, data: GoalCreateInput, orgId?: string | null): Promise<GoalInterface> => {
    const goal = await Goal.create({ ...data, userId, currentAmount: 0, organizationId: orgId || null });
    return goal.dataValues as GoalInterface;
  },

  findByUser: async (userId: string, orgContext?: OrgContext): Promise<GoalInterface[]> => {
    const where: Record<string, unknown> = {};

    if (orgContext) {
      where.userId = { [Op.in]: orgContext.memberIds };
      where.organizationId = orgContext.orgId;
    } else {
      where.userId = userId;
      where.organizationId = null;
    }

    const goals = await Goal.findAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['name'], required: false }],
      order: [['deadline', 'ASC NULLS LAST'], ['createdAt', 'DESC']],
    });
    return goals.map(g => g.dataValues as GoalInterface);
  },

  findByIdAndUser: async (id: string, userId: string, orgContext?: OrgContext): Promise<GoalInterface | null> => {
    const where: Record<string, unknown> = { id };

    if (orgContext) {
      where.userId = { [Op.in]: orgContext.memberIds };
      where.organizationId = orgContext.orgId;
    } else {
      where.userId = userId;
    }

    const goal = await Goal.findOne({
      where,
      include: [{ model: Category, as: 'category', attributes: ['name'], required: false }],
    });
    return goal ? (goal.dataValues as GoalInterface) : null;
  },

  update: async (id: string, userId: string, data: GoalUpdateInput, orgContext?: OrgContext): Promise<GoalInterface | null> => {
    const where: Record<string, unknown> = { id };

    if (orgContext) {
      where.userId = { [Op.in]: orgContext.memberIds };
      where.organizationId = orgContext.orgId;
    } else {
      where.userId = userId;
    }

    const [affectedCount, affectedRows] = await Goal.update(data, {
      where,
      returning: true,
    });
    if (affectedCount === 0 || !affectedRows[0]) return null;
    return affectedRows[0].dataValues as GoalInterface;
  },

  delete: async (id: string, userId: string, orgContext?: OrgContext): Promise<boolean> => {
    const where: Record<string, unknown> = { id };

    if (orgContext) {
      where.userId = { [Op.in]: orgContext.memberIds };
      where.organizationId = orgContext.orgId;
    } else {
      where.userId = userId;
    }

    const deleted = await Goal.destroy({ where });
    return deleted > 0;
  },
};
