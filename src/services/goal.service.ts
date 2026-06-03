import { Op, fn, col } from 'sequelize';
import { GoalRepository } from '../repositories/goal.repository.js';
import Goal from '../models/goal.model.js';
import Transaction from '../models/transaction.model.js';
import Category from '../models/category.model.js';
import type { GoalInterface, GoalCreateInput, GoalUpdateInput, GoalDTO } from '../types/goal.types.js';
import { BusinessError } from '../utils/errors.js';

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
  create: async (userId: string, data: GoalCreateInput): Promise<GoalDTO> => {
    const goal = await GoalRepository.create(userId, data);
    return mapToGoalDTO(goal);
  },

  findByUser: async (userId: string): Promise<GoalDTO[]> => {
    const goals = await GoalRepository.findByUser(userId);
    const goalDTOs: GoalDTO[] = [];
    for (const g of goals) {
      let categoryName: string | undefined;
      if (g.categoryId) {
        const category = await Category.findByPk(g.categoryId);
        categoryName = category?.name;
      }
      goalDTOs.push(mapToGoalDTO(g, categoryName ?? 'Unknown'));
    }
    return goalDTOs;
  },

  findByIdAndUser: async (id: string, userId: string): Promise<GoalDTO | null> => {
    const goal = await GoalRepository.findByIdAndUser(id, userId);
    if (!goal) return null;
    let categoryName = 'Unknown';
    if (goal.categoryId) {
      const category = await Category.findByPk(goal.categoryId);
      categoryName = category?.name ?? 'Unknown';
    }
    return mapToGoalDTO(goal, categoryName);
  },

  update: async (id: string, userId: string, data: GoalUpdateInput): Promise<GoalDTO> => {
    const updated = await GoalRepository.update(id, userId, data);
    if (!updated) {
      throw new BusinessError('Goal not found', 404);
    }
    return mapToGoalDTO(updated);
  },

  delete: async (id: string, userId: string): Promise<void> => {
    const success = await GoalRepository.delete(id, userId);
    if (!success) {
      throw new BusinessError('Goal not found', 404);
    }
  },

  recalcCurrentAmount: async (userId: string, categoryId: string): Promise<void> => {
    const goals = await Goal.findAll({ where: { userId, categoryId } });

    for (const goal of goals) {
      const where: Record<string, unknown> = {
        userId,
        categoryId,
        type: 'outcome',
      };

      if (goal.deadline) {
        where.date = { [Op.lte]: goal.deadline };
      }

      const result = await Transaction.findAll({
        where,
        attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total']],
        raw: true,
      });

      const total = Number((result[0] as { total: string } | undefined)?.total ?? 0);

      await Goal.update({ currentAmount: total }, { where: { id: goal.id } });
    }
  },
};
