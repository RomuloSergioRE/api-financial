import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import { TransactionRepository } from '../repositories/transaction.repository.js';
import type { TransactionCreateInput, TransactionUpdateInput, TransactionDTO, TransactionInterface } from '../types/transaction.types.js';
import type { OrgContext } from '../types/organization.types.js';
import { BusinessError } from '../utils/errors.js';
import { resolveOrgContext } from '../utils/org-resolver.js';
import { BudgetService } from './budget.service.js';
import { GoalService } from './goal.service.js';
import { Tag, TransactionTag } from '../models/index.js';

const mapToTransactionDTO = (transaction: TransactionInterface): TransactionDTO => {
  const { deletedAt, ...transactionDto } = transaction;
  return {
    ...transactionDto,
    isRecurring: transaction.recurringRuleId != null,
  };
};

export const TransactionService = {
  create: async (userId: string, data: TransactionCreateInput, orgId?: string | null): Promise<TransactionDTO> => {
    const transaction = await TransactionRepository.create(userId, data, orgId);
    if (data.type === 'outcome' && data.categoryId) {
      const orgContext = orgId ? await resolveOrgContext(orgId) : undefined;
      await BudgetService.recalcSpent(userId, data.categoryId, data.date, orgContext, transaction.amount);
      await GoalService.recalcCurrentAmount(userId, data.categoryId, orgContext);
    }
    return mapToTransactionDTO(transaction);
  },

  findByUser: async (
    userId: string,
    pagination?: { offset: number; limit: number },
    categoryId?: string,
    startDate?: string,
    endDate?: string,
    search?: string,
    tagIds?: string[],
    orgId?: string
  ): Promise<{ rows: TransactionDTO[]; total: number }> => {
    const orgContext = orgId ? await resolveOrgContext(orgId) : undefined;
    const { rows, total } = await TransactionRepository.findByUser(
      userId, pagination, categoryId, startDate, endDate, search, tagIds, orgContext
    );
    return { rows: rows.map(mapToTransactionDTO), total };
  },

  findByIdAndUser: async (id: string, userId: string, orgId?: string): Promise<TransactionDTO | null> => {
    const orgContext = orgId ? await resolveOrgContext(orgId) : undefined;
    const transaction = await TransactionRepository.findByIdAndUser(id, userId, orgContext);
    return transaction ? mapToTransactionDTO(transaction) : null;
  },

  update: async (id: string, userId: string, data: TransactionUpdateInput, orgId?: string): Promise<TransactionDTO> => {
    const orgContext = orgId ? await resolveOrgContext(orgId) : undefined;

    return sequelize.transaction(async (t) => {
      const old = await TransactionRepository.findByIdAndUser(id, userId, orgContext);
      if (!old) {
        throw new BusinessError('Transaction not found or unauthorized', 404);
      }

      const updated = await TransactionRepository.update(id, userId, data, orgContext);
      if (!updated) {
        throw new BusinessError('Transaction not found or unauthorized', 404);
      }

      const bucketChanged = data.categoryId !== undefined || data.date !== undefined;

      const oldBucketDelta = bucketChanged
        ? (old.type === 'outcome' ? -old.amount : 0)
        : ((updated.type === 'outcome' ? updated.amount : 0) - (old.type === 'outcome' ? old.amount : 0));

      await BudgetService.recalcSpent(userId, old.categoryId, old.date, orgContext, oldBucketDelta);
      await GoalService.recalcCurrentAmount(userId, old.categoryId, orgContext);

      if (bucketChanged && updated.type === 'outcome') {
        const recalcCategoryId = data.categoryId ?? old.categoryId;
        const recalcDate = data.date ?? old.date;
        await BudgetService.recalcSpent(userId, recalcCategoryId, recalcDate, orgContext, updated.amount);
      }
      if (updated.type === 'outcome' && data.categoryId) {
        await GoalService.recalcCurrentAmount(userId, data.categoryId, orgContext);
      }

      return mapToTransactionDTO(updated);
    });
  },

  delete: async (id: string, userId: string, orgId?: string): Promise<void> => {
    const orgContext = orgId ? await resolveOrgContext(orgId) : undefined;

    return sequelize.transaction(async (t) => {
      const old = await TransactionRepository.findByIdAndUser(id, userId, orgContext);
      if (!old) {
        throw new BusinessError('Transaction not found or unauthorized', 404);
      }

      const success = await TransactionRepository.delete(id, userId, orgContext);
      if (!success) {
        throw new BusinessError('Transaction not found or unauthorized', 404);
      }

      await BudgetService.recalcSpent(userId, old.categoryId, old.date, orgContext, old.type === 'outcome' ? -old.amount : 0);
      await GoalService.recalcCurrentAmount(userId, old.categoryId, orgContext);
    });
  },

  linkTags: async (transactionId: string, userId: string, tagIds: string[], orgId?: string): Promise<void> => {
    const orgContext = orgId ? await resolveOrgContext(orgId) : undefined;
    const transaction = await TransactionRepository.findByIdAndUser(transactionId, userId, orgContext);
    if (!transaction) {
      throw new BusinessError('Transaction not found or unauthorized', 404);
    }

    const tagWhere: Record<string, unknown> = { id: { [Op.in]: tagIds } };
    if (orgContext) {
      tagWhere.userId = { [Op.in]: orgContext.memberIds };
    } else {
      tagWhere.userId = userId;
    }

    const tags = await Tag.findAll({ where: tagWhere });
    if (tags.length !== tagIds.length) {
      throw new BusinessError('One or more tags not found', 404);
    }

    const existing = await TransactionTag.findAll({
      where: { transactionId, tagId: { [Op.in]: tagIds } },
    });
    const existingTagIds = new Set(existing.map(et => et.tagId));
    const newEntries = tagIds
      .filter(tid => !existingTagIds.has(tid))
      .map(tagId => ({ transactionId, tagId }));

    if (newEntries.length > 0) {
      await TransactionTag.bulkCreate(newEntries);
    }
  },

  unlinkTag: async (transactionId: string, userId: string, tagId: string, orgId?: string): Promise<void> => {
    const orgContext = orgId ? await resolveOrgContext(orgId) : undefined;
    const transaction = await TransactionRepository.findByIdAndUser(transactionId, userId, orgContext);
    if (!transaction) {
      throw new BusinessError('Transaction not found or unauthorized', 404);
    }

    const deleted = await TransactionTag.destroy({ where: { transactionId, tagId } });
    if (deleted === 0) {
      throw new BusinessError('Tag not linked to this transaction', 404);
    }
  },
};
