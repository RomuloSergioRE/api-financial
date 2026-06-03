import { Op } from 'sequelize';
import Budget from '../models/budget.model.js';
import type { BudgetInterface, BudgetCreateInput, BudgetUpdateInput } from '../types/budget.types.js';

export const BudgetRepository = {
  create: async (userId: string, data: BudgetCreateInput): Promise<BudgetInterface> => {
    const budget = await Budget.create({ ...data, userId, spent: 0 });
    return budget.dataValues as BudgetInterface;
  },

  findByUser: async (userId: string, month?: number, year?: number): Promise<BudgetInterface[]> => {
    const where: Record<string, unknown> = { userId };
    if (month) where.month = month;
    if (year) where.year = year;
    const budgets = await Budget.findAll({ where, order: [['year', 'DESC'], ['month', 'DESC']] });
    return budgets.map(b => b.dataValues as BudgetInterface);
  },

  findByIdAndUser: async (id: string, userId: string): Promise<BudgetInterface | null> => {
    const budget = await Budget.findOne({ where: { id, userId } });
    return budget ? (budget.dataValues as BudgetInterface) : null;
  },

  update: async (id: string, userId: string, data: BudgetUpdateInput): Promise<BudgetInterface | null> => {
    const [affectedCount, affectedRows] = await Budget.update(data, {
      where: { id, userId },
      returning: true,
    });
    if (affectedCount === 0 || !affectedRows[0]) return null;
    return affectedRows[0].dataValues as BudgetInterface;
  },

  delete: async (id: string, userId: string): Promise<boolean> => {
    const deleted = await Budget.destroy({ where: { id, userId } });
    return deleted > 0;
  },

  findByUserCategoryMonthYear: async (userId: string, categoryId: string, month: number, year: number): Promise<BudgetInterface | null> => {
    const budget = await Budget.findOne({ where: { userId, categoryId, month, year } });
    return budget ? (budget.dataValues as BudgetInterface) : null;
  },
};
