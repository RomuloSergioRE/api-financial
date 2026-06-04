import { Op } from 'sequelize';
import Budget from '../models/budget.model.js';
import Category from '../models/category.model.js';
import type { BudgetInterface, BudgetCreateInput, BudgetUpdateInput } from '../types/budget.types.js';
import type { OrgContext } from '../types/organization.types.js';

export const BudgetRepository = {
  create: async (userId: string, data: BudgetCreateInput, orgId?: string | null): Promise<BudgetInterface> => {
    const budget = await Budget.create({ ...data, userId, spent: 0, organizationId: orgId || null });
    return budget.dataValues as BudgetInterface;
  },

  findByUser: async (userId: string, month?: number, year?: number, orgContext?: OrgContext): Promise<BudgetInterface[]> => {
    const where: Record<string, unknown> = {};

    if (orgContext) {
      where.userId = { [Op.in]: orgContext.memberIds };
      where.organizationId = orgContext.orgId;
    } else {
      where.userId = userId;
      where.organizationId = null;
    }

    if (month) where.month = month;
    if (year) where.year = year;
    const budgets = await Budget.findAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['name'], required: false }],
      order: [['year', 'DESC'], ['month', 'DESC']],
    });
    return budgets.map(b => b.dataValues as BudgetInterface);
  },

  findByIdAndUser: async (id: string, userId: string, orgContext?: OrgContext): Promise<BudgetInterface | null> => {
    const where: Record<string, unknown> = { id };

    if (orgContext) {
      where.userId = { [Op.in]: orgContext.memberIds };
      where.organizationId = orgContext.orgId;
    } else {
      where.userId = userId;
    }

    const budget = await Budget.findOne({
      where,
      include: [{ model: Category, as: 'category', attributes: ['name'], required: false }],
    });
    return budget ? (budget.dataValues as BudgetInterface) : null;
  },

  update: async (id: string, userId: string, data: BudgetUpdateInput, orgContext?: OrgContext): Promise<BudgetInterface | null> => {
    const where: Record<string, unknown> = { id };

    if (orgContext) {
      where.userId = { [Op.in]: orgContext.memberIds };
      where.organizationId = orgContext.orgId;
    } else {
      where.userId = userId;
    }

    const [affectedCount, affectedRows] = await Budget.update(data, {
      where,
      returning: true,
    });
    if (affectedCount === 0 || !affectedRows[0]) return null;
    return affectedRows[0].dataValues as BudgetInterface;
  },

  delete: async (id: string, userId: string, orgContext?: OrgContext): Promise<boolean> => {
    const where: Record<string, unknown> = { id };

    if (orgContext) {
      where.userId = { [Op.in]: orgContext.memberIds };
      where.organizationId = orgContext.orgId;
    } else {
      where.userId = userId;
    }

    const deleted = await Budget.destroy({ where });
    return deleted > 0;
  },

  findByUserCategoryMonthYear: async (userId: string, categoryId: string, month: number, year: number, orgContext?: OrgContext): Promise<BudgetInterface | null> => {
    const where: Record<string, unknown> = { categoryId, month, year };

    if (orgContext) {
      where.userId = { [Op.in]: orgContext.memberIds };
      where.organizationId = orgContext.orgId;
    } else {
      where.userId = userId;
    }

    const budget = await Budget.findOne({ where });
    return budget ? (budget.dataValues as BudgetInterface) : null;
  },
};
