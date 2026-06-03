import { Op, fn, col } from 'sequelize';
import sequelize from '../config/db.js';
import { BudgetRepository } from '../repositories/budget.repository.js';
import Budget from '../models/budget.model.js';
import Transaction from '../models/transaction.model.js';
import Category from '../models/category.model.js';
import { resolveOrgMemberIds } from '../utils/org-resolver.js';
import type { BudgetInterface, BudgetCreateInput, BudgetUpdateInput, BudgetDTO } from '../types/budget.types.js';
import { BusinessError } from '../utils/errors.js';

interface OrgContext {
  memberIds: string[];
  orgId: string;
}

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
  create: async (userId: string, data: BudgetCreateInput, orgId?: string | null): Promise<BudgetDTO> => {
    const budget = await BudgetRepository.create(userId, data, orgId);
    return mapToBudgetDTO(budget);
  },

  findByUser: async (userId: string, month?: number, year?: number, orgId?: string): Promise<BudgetDTO[]> => {
    const orgContext = orgId ? { memberIds: await resolveOrgMemberIds(orgId), orgId } : undefined;
    const budgets = await BudgetRepository.findByUser(userId, month, year, orgContext);
    return budgets.map(b => mapToBudgetDTO(b, (b as unknown as { category?: { name: string } }).category?.name ?? 'Unknown'));
  },

  findByIdAndUser: async (id: string, userId: string, orgId?: string): Promise<BudgetDTO | null> => {
    const orgContext = orgId ? { memberIds: await resolveOrgMemberIds(orgId), orgId } : undefined;
    const budget = await BudgetRepository.findByIdAndUser(id, userId, orgContext);
    if (!budget) return null;
    return mapToBudgetDTO(budget, (budget as unknown as { category?: { name: string } }).category?.name ?? 'Unknown');
  },

  update: async (id: string, userId: string, data: BudgetUpdateInput, orgId?: string): Promise<BudgetDTO> => {
    const orgContext = orgId ? { memberIds: await resolveOrgMemberIds(orgId), orgId } : undefined;
    const updated = await BudgetRepository.update(id, userId, data, orgContext);
    if (!updated) {
      throw new BusinessError('Budget not found', 404);
    }
    return mapToBudgetDTO(updated);
  },

  delete: async (id: string, userId: string, orgId?: string): Promise<void> => {
    const orgContext = orgId ? { memberIds: await resolveOrgMemberIds(orgId), orgId } : undefined;
    const success = await BudgetRepository.delete(id, userId, orgContext);
    if (!success) {
      throw new BusinessError('Budget not found', 404);
    }
  },

  recalcSpent: async (userId: string, categoryId: string, date: Date, orgContext?: OrgContext): Promise<void> => {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const txWhere: Record<string, unknown> = {
      categoryId,
      type: 'outcome',
      date: {
        [Op.gte]: new Date(year, month - 1, 1),
        [Op.lt]: new Date(year, month, 1),
      },
    };

    if (orgContext) {
      txWhere.userId = { [Op.in]: orgContext.memberIds };
      txWhere.organizationId = orgContext.orgId;
    } else {
      txWhere.userId = userId;
    }

    const budgetWhere: Record<string, unknown> = { categoryId, month, year };
    if (orgContext) {
      budgetWhere.organizationId = orgContext.orgId;
      budgetWhere.userId = { [Op.in]: orgContext.memberIds };
    } else {
      budgetWhere.userId = userId;
    }

    await sequelize.transaction(async (t) => {
      const result = await Transaction.findAll({
        where: txWhere,
        attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total']],
        raw: true,
        transaction: t,
      });

      const total = Number((result[0] as { total: string } | undefined)?.total ?? 0);

      await Budget.update(
        { spent: total },
        { where: budgetWhere, transaction: t }
      );
    });
  },
};
