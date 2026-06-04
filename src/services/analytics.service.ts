import { Op, fn, col, literal } from 'sequelize';
import type { WhereOptions } from 'sequelize';
import { Transaction, Category, Budget, Goal } from '../models/index.js';
import type {
  BalanceSummaryDTO,
  AnalyticsFilterInput,
  CategoryShareDTO,
  MonthlySeriesDTO,
  ComparisonDTO,
  TopCategoryDTO,
  ExecutiveSummaryDTO,
  CashFlowProjectionDTO,
} from '../types/analytics.types.js';
import { getCached, setCache, clearCache } from '../utils/cache.js';

type AggregateRow = { type: string; total: string };
type CategoryAggRow = {
  categoryId: string;
  total: string;
  'category.name': string;
  'category.color': string | null;
  'category.icon': string | null;
};
type MonthlySeriesRow = {
  month: string;
  type: string;
  total: string;
};

type TopCategoryRow = {
  categoryId: string;
  total: string;
  category?: { name: string };
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

function defaultFilters(): AnalyticsFilterInput {
  return {};
}

export const AnalyticsService = {

  getBalanceSummary: async (userId: string, filters: AnalyticsFilterInput = defaultFilters()): Promise<BalanceSummaryDTO> => {
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

  getCategoryDistribution: async (userId: string, filters: AnalyticsFilterInput = defaultFilters()): Promise<CategoryShareDTO[]> => {
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
      group: ['category_id', 'category.id'],
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

  getMonthlySeries: async (userId: string, filters: AnalyticsFilterInput = defaultFilters()): Promise<MonthlySeriesDTO[]> => {
    const cacheKey = `series:${userId}:${JSON.stringify(filters)}`;
    const cached = getCached<MonthlySeriesDTO[]>(cacheKey);
    if (cached) return cached;

    const whereCondition = buildWhereCondition(userId, filters);

    const results = await Transaction.findAll({
      where: whereCondition,
      attributes: [
        [fn('to_char', col('date'), 'YYYY-MM'), 'month'],
        'type',
        [fn('SUM', col('amount')), 'total'],
      ],
      group: [fn('to_char', col('date'), 'YYYY-MM'), 'type'],
      order: [[fn('to_char', col('date'), 'YYYY-MM'), 'ASC']],
      raw: true,
    });

    const rows = results as unknown as MonthlySeriesRow[];

    const monthMap = new Map<string, MonthlySeriesDTO>();
    for (const row of rows) {
      const m = row.month;
      if (!monthMap.has(m)) {
        monthMap.set(m, { month: m, totalIncome: 0, totalOutcome: 0, netBalance: 0 });
      }
      const entry = monthMap.get(m)!;
      const total = Number(row.total);
      if (row.type === 'income') {
        entry.totalIncome += total;
      } else if (row.type === 'outcome') {
        entry.totalOutcome += total;
      }
      entry.netBalance = entry.totalIncome - entry.totalOutcome;
    }

    const data = Array.from(monthMap.values());
    setCache(cacheKey, data, 30_000);
    return data;
  },

  getComparison: async (userId: string, month?: number, year?: number): Promise<ComparisonDTO> => {
    const now = new Date();
    const currentMonth = month ?? now.getMonth() + 1;
    const currentYear = year ?? now.getFullYear();

    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }

    const monthStr = (m: number, y: number) => `${y}-${String(m).padStart(2, '0')}`;

    const currentFilter: AnalyticsFilterInput = {
      startDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
      endDate: monthStr(currentMonth, currentYear),
    };
    const currentEnd = new Date(currentYear, currentMonth, 0);
    currentFilter.endDate = currentEnd.toISOString().split('T')[0];

    const prevFilter: AnalyticsFilterInput = {
      startDate: `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`,
      endDate: new Date(prevYear, prevMonth, 0).toISOString().split('T')[0],
    };

    const [currentBalance, previousBalance] = await Promise.all([
      AnalyticsService.getBalanceSummary(userId, currentFilter),
      AnalyticsService.getBalanceSummary(userId, prevFilter),
    ]);

    const calcChange = (curr: number, prev: number): number | null => {
      if (prev === 0) return curr === 0 ? null : 100;
      return Number(((curr - prev) / prev * 100).toFixed(2));
    };

    return {
      current: { ...currentBalance, month: currentMonth, year: currentYear },
      previous: { ...previousBalance, month: prevMonth, year: prevYear },
      changes: {
        incomeChange: calcChange(currentBalance.totalIncome, previousBalance.totalIncome),
        outcomeChange: calcChange(currentBalance.totalOutcome, previousBalance.totalOutcome),
        netChange: calcChange(currentBalance.netBalance, previousBalance.netBalance),
      },
    };
  },

  getTopCategories: async (userId: string, filters: AnalyticsFilterInput = defaultFilters(), limit = 5): Promise<TopCategoryDTO[]> => {
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
        attributes: ['name'],
        required: false,
      }],
      group: ['category_id', 'category.id'],
      order: [[literal('SUM(amount)'), 'DESC']],
      limit,
      raw: true,
      nest: true,
    });

    const rows = results as unknown as TopCategoryRow[];

    const totalPeriod = rows.reduce((sum, r) => sum + Number(r.total), 0);

    return rows.map(r => ({
      categoryId: r.categoryId,
      categoryName: r.category?.name ?? 'Uncategorized',
      totalAmount: Number(r.total),
      percentage: totalPeriod > 0 ? Number(((Number(r.total) / totalPeriod) * 100).toFixed(2)) : 0,
    }));
  },

  getExecutiveSummary: async (userId: string, month?: number, year?: number): Promise<ExecutiveSummaryDTO> => {
    const now = new Date();
    const currentMonth = month ?? now.getMonth() + 1;
    const currentYear = year ?? now.getFullYear();

    const monthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const monthEndDate = new Date(currentYear, currentMonth, 0);
    const monthEnd = monthEndDate.toISOString().split('T')[0];

    const filter: AnalyticsFilterInput = { startDate: monthStart, endDate: monthEnd };

    const [balance, topCats, transactions, budgetsOver, goalsDone] = await Promise.all([
      AnalyticsService.getBalanceSummary(userId, filter),
      AnalyticsService.getTopCategories(userId, filter, 1),
      Transaction.findAll({
        where: {
          userId,
          type: 'outcome',
          date: {
            [Op.gte]: new Date(monthStart),
            [Op.lte]: new Date(monthEnd + 'T23:59:59.999Z'),
          },
        },
        order: [['amount', 'DESC']],
        attributes: ['amount', 'description', 'date'],
        raw: true,
      }),
      Budget.count({
        where: {
          userId,
          month: currentMonth,
          year: currentYear,
          spent: { [Op.gt]: literal('"limit"') },
        },
      }),
      Goal.count({
        where: {
          userId,
          currentAmount: { [Op.gte]: col('target_amount') },
        },
      }),
    ]);

    const transactionCount = transactions.length;
    const dailyAverage = monthEndDate.getDate() > 0
      ? Math.round(balance.totalOutcome / monthEndDate.getDate())
      : 0;

    const biggestExpenseRaw = transactions[0] as Record<string, unknown> | undefined;
    const biggestExpense = biggestExpenseRaw
      ? {
          amount: Number(biggestExpenseRaw.amount),
          description: String(biggestExpenseRaw.description ?? ''),
          date: String(biggestExpenseRaw.date).split('T')[0] ?? '',
        }
      : null;

    return {
      month: currentMonth,
      year: currentYear,
      totalIncome: balance.totalIncome,
      totalOutcome: balance.totalOutcome,
      netBalance: balance.netBalance,
      topCategory: topCats.length > 0
        ? { name: topCats[0]!.categoryName, amount: topCats[0]!.totalAmount }
        : null,
      transactionCount,
      dailyAverage,
      biggestExpense,
      budgetAlerts: budgetsOver,
      goalAchieved: goalsDone,
    };
  },

  getCashFlowProjection: async (userId: string, months = 3): Promise<CashFlowProjectionDTO[]> => {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const startDate = threeMonthsAgo.toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];

    const historicalFilter: AnalyticsFilterInput = { startDate, endDate };

    const historical = await AnalyticsService.getMonthlySeries(userId, historicalFilter);

    const avgIncome = historical.length > 0
      ? Math.round(historical.reduce((s, m) => s + m.totalIncome, 0) / historical.length)
      : 0;
    const avgOutcome = historical.length > 0
      ? Math.round(historical.reduce((s, m) => s + m.totalOutcome, 0) / historical.length)
      : 0;

    const projection: CashFlowProjectionDTO[] = [];
    for (let i = 1; i <= months; i++) {
      const projDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthStr = `${projDate.getFullYear()}-${String(projDate.getMonth() + 1).padStart(2, '0')}`;
      projection.push({
        month: monthStr,
        projectedIncome: avgIncome,
        projectedOutcome: avgOutcome,
        projectedNet: avgIncome - avgOutcome,
      });
    }

    return projection;
  },

  invalidateCache: (userId: string): void => {
    clearCache(`balance:${userId}`);
    clearCache(`categories:${userId}`);
    clearCache(`series:${userId}`);
  },
};
