import { Op, fn, col } from 'sequelize';
import { BudgetRepository } from '../repositories/budget.repository.js';
import Budget from '../models/budget.model.js';
import Transaction from '../models/transaction.model.js';
import Category from '../models/category.model.js';
import type { BudgetInterface, BudgetCreateInput, BudgetUpdateInput, BudgetDTO } from '../types/budget.types.js';
import { BusinessError } from '../utils/errors.js';

const mapToBudgetDTO = (budget: BudgetInterface, categoryName = 'Unknown'): BudgetDTO => {
  const percentage = budget.limit > 0 ? Math.round((budget.spent / budget.limit) * 100) : 0;
  return {
    id: budget.id,
    userId: budget.userId,
    categoryId: budget.categoryId,
    month: budget.month,
    year: budget.year,
    limit: budget.limit,
    spent: budget.spent,
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
    categoryName,
    overBudget: budget.spent > budget.limit,
    percentage,
  };
};

export const BudgetService = {
  create: async (userId: string, data: BudgetCreateInput): Promise<BudgetDTO> => {
    const budget = await BudgetRepository.create(userId, data);
    return mapToBudgetDTO(budget);
  },

  findByUser: async (userId: string, month?: number, year?: number): Promise<BudgetDTO[]> => {
    const budgets = await BudgetRepository.findByUser(userId, month, year);

    const budgetDTOs: BudgetDTO[] = [];
    for (const b of budgets) {
      const category = await Category.findByPk(b.categoryId);
      budgetDTOs.push(mapToBudgetDTO(b, category?.name ?? 'Unknown'));
    }
    return budgetDTOs;
  },

  findByIdAndUser: async (id: string, userId: string): Promise<BudgetDTO | null> => {
    const budget = await BudgetRepository.findByIdAndUser(id, userId);
    if (!budget) return null;
    const category = await Category.findByPk(budget.categoryId);
    return mapToBudgetDTO(budget, category?.name ?? 'Unknown');
  },

  update: async (id: string, userId: string, data: BudgetUpdateInput): Promise<BudgetDTO> => {
    const updated = await BudgetRepository.update(id, userId, data);
    if (!updated) {
      throw new BusinessError('Budget not found', 404);
    }
    return mapToBudgetDTO(updated);
  },

  delete: async (id: string, userId: string): Promise<void> => {
    const success = await BudgetRepository.delete(id, userId);
    if (!success) {
      throw new BusinessError('Budget not found', 404);
    }
  },

  recalcSpent: async (userId: string, categoryId: string, date: Date): Promise<void> => {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const result = await Transaction.findAll({
      where: {
        userId,
        categoryId,
        type: 'outcome',
        date: {
          [Op.gte]: new Date(year, month - 1, 1),
          [Op.lt]: new Date(year, month, 1),
        },
      },
      attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total']],
      raw: true,
    });

    const total = Number((result[0] as { total: string } | undefined)?.total ?? 0);

    await Budget.update(
      { spent: total },
      { where: { userId, categoryId, month, year } }
    );
  },
};
