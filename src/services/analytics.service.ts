import { Op, fn, col } from 'sequelize';
import type { WhereOptions } from 'sequelize'; 
import { Transaction, Category } from '../models/index.js';
import type { BalanceSummaryDTO, AnalyticsFilterInput, CategoryShareDTO, SequelizeGroupResult } from '../types/analytics.types.js';

export const AnalyticsService = {

  //Calcula o saldo total separando entradas, saídas e o saldo líquido residual
  getBalanceSummary: async (userId: string, filters: AnalyticsFilterInput): Promise<BalanceSummaryDTO> => {
      const whereCondition: WhereOptions = { userId };

      if (filters.startDate || filters.endDate) {
        const dateConditions: Record<symbol, Date> = {};
        
        if (filters.startDate) {
          const start = new Date(filters.startDate);
          start.setUTCHours(0, 0, 0, 0);
          dateConditions[Op.gte] = start;
        }
        
        if (filters.endDate) {
          const end = new Date(filters.endDate);
          end.setUTCHours(23, 59, 59, 999);
          dateConditions[Op.lte] = end;
        }
        
        whereCondition.date = dateConditions;
      }

      if (filters.categoryId) {
        whereCondition.categoryId = filters.categoryId;
      }

      const transactions = await Transaction.findAll({
        where: whereCondition,
        attributes: ['amount', 'type'],
        raw: true
      });

      let totalIncome = 0;
      let totalOutcome = 0;

      for (const transaction of transactions) {
        if (transaction.type === 'income') {
          totalIncome += transaction.amount;
        } else if (transaction.type === 'outcome') {
          totalOutcome += transaction.amount;
        }
      }

      return {
        totalIncome,
        totalOutcome,
        netBalance: totalIncome - totalOutcome
      };
  },
   // Agrupa os gastos por categoria e calcula a participação percentual de cada uma no período
  getCategoryDistribution: async (userId: string, filters: AnalyticsFilterInput): Promise<CategoryShareDTO[]> => {
    const whereCondition: WhereOptions = { userId };

    if (filters.startDate || filters.endDate) {
      const dateConditions: Record<symbol, Date> = {};
      
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setUTCHours(0, 0, 0, 0);
        dateConditions[Op.gte] = start;
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setUTCHours(23, 59, 59, 999);
        dateConditions[Op.lte] = end;
      }
      
      whereCondition.date = dateConditions;
    }

    const results = await Transaction.findAll({
      where: whereCondition,
      attributes: [
        'categoryId',
        [fn('SUM', col('amount')), 'total'],
      ],
      include: [{
        model: Category,
        as: 'category',
        attributes: ['name', 'color', 'icon'],
        where: { userId }
      }],
      group: ['Transaction.categoryId', 'category.id'],
      raw: true,
      nest: true
    });

    const groupResults = results as unknown as SequelizeGroupResult[];
    const totalPeriod = groupResults.reduce((sum, item) => sum + Number(item.total), 0);

    if (totalPeriod === 0) return [];
    return groupResults.map((item): CategoryShareDTO => {
      const totalAmount = Number(item.total);
      const percentage = Number(((totalAmount / totalPeriod) * 100).toFixed(2));

      return {
        categoryId: item.categoryId,
        categoryName: item.category?.name || 'Uncategorized',
        color: item.category?.color || null,
        icon: item.category?.icon || null,
        totalAmount,
        percentage
      };
    });
  }
};