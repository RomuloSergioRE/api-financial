import { Op, fn, col } from 'sequelize';
import sequelize from '../config/db.js';
import { GoalRepository } from '../repositories/goal.repository.js';
import Goal from '../models/goal.model.js';
import Transaction from '../models/transaction.model.js';
import Category from '../models/category.model.js';
import { resolveOrgContext } from '../utils/org-resolver.js';
import type { GoalInterface, GoalCreateInput, GoalUpdateInput, GoalDTO } from '../types/goal.types.js';
import type { OrgContext } from '../types/organization.types.js';
import { BusinessError } from '../utils/errors.js';

type WithCategoryName = { category?: { name: string } };

const mapToGoalDTO = (goal: GoalInterface, categoryName = 'Unknown'): GoalDTO => {
  const progress = goal.targetAmount > 0
    ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
    : 0;
  return {
    id: goal.id,
    userId: goal.userId,
    categoryId: goal.categoryId,
    name: goal.name,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    deadline: goal.deadline,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
    categoryName,
    progress,
    achieved: goal.currentAmount >= goal.targetAmount,
  };
};

export const GoalService = {
  create: async (userId: string, data: GoalCreateInput, orgId?: string | null): Promise<GoalDTO> => {
    const goal = await GoalRepository.create(userId, data, orgId);
    return mapToGoalDTO(goal);
  },

  findByUser: async (userId: string, orgId?: string): Promise<GoalDTO[]> => {
    const orgContext = orgId ? await resolveOrgContext(orgId) : undefined;
    const goals = await GoalRepository.findByUser(userId, orgContext);
    return goals.map(g => mapToGoalDTO(g, (g as unknown as WithCategoryName).category?.name ?? 'Unknown'));
  },

  findByIdAndUser: async (id: string, userId: string, orgId?: string): Promise<GoalDTO | null> => {
    const orgContext = orgId ? await resolveOrgContext(orgId) : undefined;
    const goal = await GoalRepository.findByIdAndUser(id, userId, orgContext);
    if (!goal) return null;
    return mapToGoalDTO(goal, (goal as unknown as WithCategoryName).category?.name ?? 'Unknown');
  },

  update: async (id: string, userId: string, data: GoalUpdateInput, orgId?: string): Promise<GoalDTO> => {
    const orgContext = orgId ? await resolveOrgContext(orgId) : undefined;
    const updated = await GoalRepository.update(id, userId, data, orgContext);
    if (!updated) {
      throw new BusinessError('Goal not found', 404);
    }
    return mapToGoalDTO(updated, (updated as unknown as WithCategoryName).category?.name ?? 'Unknown');
  },

  delete: async (id: string, userId: string, orgId?: string): Promise<void> => {
    const orgContext = orgId ? await resolveOrgContext(orgId) : undefined;
    const success = await GoalRepository.delete(id, userId, orgContext);
    if (!success) {
      throw new BusinessError('Goal not found', 404);
    }
  },

  recalcCurrentAmount: async (userId: string, categoryId: string, orgContext?: OrgContext): Promise<void> => {
    const goalWhere: Record<string, unknown> = { categoryId };
    if (orgContext) {
      goalWhere.userId = { [Op.in]: orgContext.memberIds };
      goalWhere.organizationId = orgContext.orgId;
    } else {
      goalWhere.userId = userId;
    }

    const goals = await Goal.findAll({ where: goalWhere });

    await sequelize.transaction(async (t) => {
      for (const goal of goals) {
        const txWhere: Record<string, unknown> = {
          categoryId,
          type: 'outcome',
        };

        if (orgContext) {
          txWhere.userId = { [Op.in]: orgContext.memberIds };
          txWhere.organizationId = orgContext.orgId;
        } else {
          txWhere.userId = userId;
        }

        if (goal.deadline) {
          txWhere.date = { [Op.lte]: goal.deadline };
        }

        const result = await Transaction.findAll({
          where: txWhere,
          attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total']],
          raw: true,
          transaction: t,
        });

        const total = Number((result[0] as { total: string } | undefined)?.total ?? 0);

        await Goal.update({ currentAmount: total }, { where: { id: goal.id }, transaction: t });
      }
    });
  },
};
