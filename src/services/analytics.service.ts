import { Op, fn, col } from 'sequelize';
import type { WhereOptions } from 'sequelize'; 
import { Transaction, Category } from '../models/index.js';
import type { BalanceSummaryDTO, AnalyticsFilterInput, CategoryShareDTO } from '../types/analytics.types.js';
import { getCached, setCache, clearCache } from '../utils/cache.js';

type AggregateRow = { type: string; total: string };
type CategoryAggRow = {
  categoryId: string;
  total: string;
  'category.name': string;
  'category.color': string | null;
  'category.icon': string | null;
};

function buildWhereCondition(userId: string, filters: AnalyticsFilterInput): WhereOptions {
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

  return whereCondition;
}

export const AnalyticsService = {

  getBalanceSummary: async (userId: string, filters: AnalyticsFilterInput): Promise<BalanceSummaryDTO> => {
    const cacheKey = `balance:${userId}:${JSON.stringify(filters)}`;
    const cached = getCached<BalanceSummaryDTO>(cacheKey);
    if (cached) return cached;

    const whereCondition = buildWhereCondition(userId, filters);

    const results = await Transaction.findAll({
      where: whereCondition,
      attributes: [
        'type',
        [fn('SUM', col('amount')), 'total'],
      ],
      group: ['type'],
      raw: true,
    });

    const rows = results as unknown as AggregateRow[];
    const totalIncome = Number(rows.find(r => r.type === 'income')?.total || 0);
    const totalOutcome = Number(rows.find(r => r.type === 'outcome')?.total || 0);

    const data: BalanceSummaryDTO = {
      totalIncome,
      totalOutcome,
      netBalance: totalIncome - totalOutcome,
    };

    setCache(cacheKey, data, 30_000);
    return data;
  },

  getCategoryDistribution: async (userId: string, filters: AnalyticsFilterInput): Promise<CategoryShareDTO[]> => {
    const cacheKey = `categories:${userId}:${JSON.stringify(filters)}`;
    const cached = getCached<CategoryShareDTO[]>(cacheKey);
    if (cached) return cached;

    const whereCondition = buildWhereCondition(userId, filters);

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
        required: false,
      }],
      group: ['Transaction.categoryId', 'category.id'],
      raw: true,
      nest: false,
    });

    const rows = results as unknown as CategoryAggRow[];
    const totalPeriod = rows.reduce((sum, item) => sum + Number(item.total), 0);

    if (totalPeriod === 0) return [];

    const data: CategoryShareDTO[] = rows.map((item): CategoryShareDTO => {
      const totalAmount = Number(item.total);
      const percentage = Number(((totalAmount / totalPeriod) * 100).toFixed(2));

      return {
        categoryId: item.categoryId,
        categoryName: item['category.name'] || 'Uncategorized',
        color: item['category.color'] || null,
        icon: item['category.icon'] || null,
        totalAmount,
        percentage,
      };
    });

    setCache(cacheKey, data, 30_000);
    return data;
  },

  invalidateCache: (userId: string): void => {
    clearCache(`balance:${userId}`);
    clearCache(`categories:${userId}`);
  },
};