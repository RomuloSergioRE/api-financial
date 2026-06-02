import { TransactionRepository } from '../repositories/transaction.repository.js';
import type { TransactionCreateInput, TransactionUpdateInput, TransactionDTO, TransactionInterface } from '../types/transaction.types.js';
import { BusinessError } from '../utils/errors.js';

const mapToTransactionDTO = (transaction: TransactionInterface): TransactionDTO => {
  const { deletedAt, ...transactionDto } = transaction;
  return transactionDto;
};

export const TransactionService = {
  create: async (userId: string, data: TransactionCreateInput): Promise<TransactionDTO> => {
    const transaction = await TransactionRepository.create(userId, data);
    return mapToTransactionDTO(transaction);
  },

  findByUser: async (userId: string, pagination?: { offset: number; limit: number }, categoryId?: string): Promise<{ rows: TransactionDTO[]; total: number }> => {
    const { rows, total } = await TransactionRepository.findByUser(userId, pagination, categoryId);
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
};