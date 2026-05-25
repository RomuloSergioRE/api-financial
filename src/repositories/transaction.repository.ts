import { Transaction, Category } from '../models/index.js'; 
import type { TransactionInterface, TransactionCreateInput, TransactionUpdateInput } from '../types/transaction.types.js';

export const TransactionRepository = {
  create: async (userId: string, data: TransactionCreateInput): Promise<TransactionInterface> => {
    const transaction = await Transaction.create({ ...data, userId });
    return transaction.dataValues as TransactionInterface;
  },

  findByUser: async (userId: string, pagination?: { offset: number; limit: number }): Promise<{ rows: TransactionInterface[]; total: number }> => {
    const { rows, count } = await Transaction.findAndCountAll({ 
      where: { userId },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'icon', 'color'] 
        }
      ],
      order: [['date', 'DESC']],
      offset: pagination?.offset ?? 0,
      limit: pagination?.limit ?? 20,
      raw: true,
      nest: true,
      distinct: true,
    });
    return { rows: rows as unknown as TransactionInterface[], total: count };
  },

  findByIdAndUser: async (id: string, userId: string): Promise<TransactionInterface | null> => {
    const transaction = await Transaction.findOne({ 
      where: { id, userId },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'icon', 'color']
        }
      ],
      raw: true,
      nest: true,
    });
    return transaction as unknown as TransactionInterface | null;
  },

  update: async (id: string, userId: string, data: TransactionUpdateInput): Promise<TransactionInterface | null> => {
    const transaction = await Transaction.findOne({ where: { id, userId } });
    if (!transaction) return null;
    
    await transaction.update(data);
    return transaction.dataValues as TransactionInterface;
  },

  delete: async (id: string, userId: string): Promise<boolean> => {
    const deletedRows = await Transaction.destroy({ where: { id, userId } });
    return deletedRows > 0;
  }
};