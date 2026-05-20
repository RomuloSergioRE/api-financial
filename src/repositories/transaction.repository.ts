import { Transaction, Category } from '../models/index.js'; 
import type { TransactionInterface, TransactionCreateInput, TransactionUpdateInput } from '../types/transaction.types.js';

export const TransactionRepository = {
  create: async (userId: string, data: TransactionCreateInput): Promise<TransactionInterface> => {
    const transaction = await Transaction.create({ ...data, userId });
    return transaction.dataValues as TransactionInterface;
  },

  findByUser: async (userId: string): Promise<TransactionInterface[]> => {
    const transactions = await Transaction.findAll({ 
      where: { userId },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'icon', 'color'] 
        }
      ],
      order: [['date', 'DESC']] 
    });
    return transactions.map(transaction => transaction.dataValues as TransactionInterface);
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
      ]
    });
    return transaction ? (transaction.dataValues as TransactionInterface) : null;
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