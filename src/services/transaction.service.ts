import { TransactionRepository } from '../repositories/transaction.repository.js';
import type { TransactionCreateInput, TransactionUpdateInput, TransactionDTO, TransactionInterface } from '../types/transaction.types.js';

const mapToTransactionDTO = (transaction: TransactionInterface): TransactionDTO => {
  const { deletedAt, ...transactionDto } = transaction;
  return transactionDto;
};

export const TransactionService = {
  create: async (userId: string, data: TransactionCreateInput): Promise<TransactionDTO> => {
    const transaction = await TransactionRepository.create(userId, data);
    return mapToTransactionDTO(transaction);
  },

  findByUser: async (userId: string): Promise<TransactionDTO[]> => {
    const transactions = await TransactionRepository.findByUser(userId);
    return transactions.map(mapToTransactionDTO);
  },

  findByIdAndUser: async (id: string, userId: string): Promise<TransactionDTO | null> => {
    const transaction = await TransactionRepository.findByIdAndUser(id, userId);
    return transaction ? mapToTransactionDTO(transaction) : null;
  },

  update: async (id: string, userId: string, data: TransactionUpdateInput): Promise<TransactionDTO> => {
    const updated = await TransactionRepository.update(id, userId, data);
    if (!updated) {
      throw new Error('Transaction not found or unauthorized');
    }
    return mapToTransactionDTO(updated);
  },

  delete: async (id: string, userId: string): Promise<void> => {
    const success = await TransactionRepository.delete(id, userId);
    if (!success) {
      throw new Error('Transaction not found or unauthorized');
    }
  },

  getBalance: async (userId: string) => {
    const transactions = await TransactionRepository.findByUser(userId);
    
    return transactions.reduce(
      (accumulator, currentTransaction) => {
        if (currentTransaction.type === 'income') {
          accumulator.income += currentTransaction.amount;
          accumulator.balance += currentTransaction.amount;
        } else {
          accumulator.outcome += currentTransaction.amount;
          accumulator.balance -= currentTransaction.amount;
        }
        return accumulator;
      },
      { income: 0, outcome: 0, balance: 0 }
    );
  }
};