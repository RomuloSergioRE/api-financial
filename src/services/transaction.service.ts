import { Op } from 'sequelize';
import { TransactionRepository } from '../repositories/transaction.repository.js';
import type { TransactionCreateInput, TransactionUpdateInput, TransactionDTO, TransactionInterface } from '../types/transaction.types.js';
import { BusinessError } from '../utils/errors.js';
import { Tag, TransactionTag } from '../models/index.js';

const mapToTransactionDTO = (transaction: TransactionInterface): TransactionDTO => {
  const { deletedAt, ...transactionDto } = transaction;
  return transactionDto;
};

export const TransactionService = {
  create: async (userId: string, data: TransactionCreateInput): Promise<TransactionDTO> => {
    const transaction = await TransactionRepository.create(userId, data);
    return mapToTransactionDTO(transaction);
  },

  findByUser: async (
    userId: string,
    pagination?: { offset: number; limit: number },
    categoryId?: string,
    startDate?: string,
    endDate?: string,
    search?: string,
    tagIds?: string[]
  ): Promise<{ rows: TransactionDTO[]; total: number }> => {
    const { rows, total } = await TransactionRepository.findByUser(
      userId, pagination, categoryId, startDate, endDate, search, tagIds
    );
    return { rows: rows.map(mapToTransactionDTO), total };
  },

  findByIdAndUser: async (id: string, userId: string): Promise<TransactionDTO | null> => {
    const transaction = await TransactionRepository.findByIdAndUser(id, userId);
    return transaction ? mapToTransactionDTO(transaction) : null;
  },

  update: async (id: string, userId: string, data: TransactionUpdateInput): Promise<TransactionDTO> => {
    const updated = await TransactionRepository.update(id, userId, data);
    if (!updated) {
      throw new BusinessError('Transaction not found or unauthorized', 404);
    }
    return mapToTransactionDTO(updated);
  },

  delete: async (id: string, userId: string): Promise<void> => {
    const success = await TransactionRepository.delete(id, userId);
    if (!success) {
      throw new BusinessError('Transaction not found or unauthorized', 404);
    }
  },

  linkTags: async (transactionId: string, userId: string, tagIds: string[]): Promise<void> => {
    const transaction = await TransactionRepository.findByIdAndUser(transactionId, userId);
    if (!transaction) {
      throw new BusinessError('Transaction not found or unauthorized', 404);
    }

    const tags = await Tag.findAll({ where: { id: { [Op.in]: tagIds }, userId } });
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

  unlinkTag: async (transactionId: string, userId: string, tagId: string): Promise<void> => {
    const transaction = await TransactionRepository.findByIdAndUser(transactionId, userId);
    if (!transaction) {
      throw new BusinessError('Transaction not found or unauthorized', 404);
    }

    const deleted = await TransactionTag.destroy({ where: { transactionId, tagId } });
    if (deleted === 0) {
      throw new BusinessError('Tag not linked to this transaction', 404);
    }
  },
};
