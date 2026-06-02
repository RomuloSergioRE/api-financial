import { Op, fn, col, literal } from 'sequelize';
import { User, Transaction, Category } from '../models/index.js';
import type { WhereOptions } from 'sequelize';
import type { UserInterface } from '../types/user.types.js';
import type { CategoryInterface, CategoryCreateInput, CategoryUpdateInput } from '../types/category.types.js';

interface UserFilters {
  role?: string;
  status?: string;
  search?: string;
}

interface Pagination {
  offset: number;
  limit: number;
}

export const AdminRepository = {
  listUsers: async (filters: UserFilters, pagination: Pagination): Promise<{ rows: UserInterface[]; total: number }> => {
    const where: WhereOptions = {};

    if (filters.role) where.role = filters.role;
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      (where as Record<string, unknown>)[Op.or as unknown as string] = [
        { name: { [Op.iLike]: `%${filters.search}%` } },
        { email: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    const { rows, count } = await User.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset: pagination.offset,
      limit: pagination.limit,
      distinct: true,
    });

    return { rows: rows.map(u => u.dataValues as UserInterface), total: count };
  },

  getUserWithStats: async (userId: string): Promise<{
    user: UserInterface | null;
    totalTransactions: number;
    totalIncome: number;
    totalOutcome: number;
  }> => {
    const [user, [result]] = await Promise.all([
      User.findByPk(userId),
      Transaction.findAll({
        where: { userId },
        attributes: [
          [fn('COUNT', col('id')), 'totalTransactions'],
          [fn('SUM', literal(`CASE WHEN type = 'income' THEN amount ELSE 0 END`)), 'totalIncome'],
          [fn('SUM', literal(`CASE WHEN type = 'outcome' THEN amount ELSE 0 END`)), 'totalOutcome'],
        ],
        raw: true,
      }),
    ]);
    if (!user) return { user: null, totalTransactions: 0, totalIncome: 0, totalOutcome: 0 };

    const agg = result as unknown as { totalTransactions: string; totalIncome: string; totalOutcome: string } | undefined;

    return {
      user: user.dataValues as UserInterface,
      totalTransactions: Number(agg?.totalTransactions || 0),
      totalIncome: Number(agg?.totalIncome || 0),
      totalOutcome: Number(agg?.totalOutcome || 0),
    };
  },

  getOverview: async (): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalTransactions: number;
    totalIncome: number;
    totalOutcome: number;
  }> => {
    const [totalUsers, activeUsers, totalTransactions, aggregated] = await Promise.all([
      User.count(),
      User.count({ where: { status: 'active' } }),
      Transaction.count(),
      Transaction.findAll({
        attributes: ['type', [fn('SUM', col('amount')), 'total']],
        group: ['type'],
        raw: true,
      }),
    ]);

    const rows = aggregated as unknown as { type: string; total: string }[];
    const totalIncome = Number(rows.find(r => r.type === 'income')?.total || 0);
    const totalOutcome = Number(rows.find(r => r.type === 'outcome')?.total || 0);

    return { totalUsers, activeUsers, totalTransactions, totalIncome, totalOutcome };
  },

  updateUser: async (id: string, data: Partial<UserInterface>): Promise<UserInterface | null> => {
    const [affectedCount, affectedRows] = await User.update(data, {
      where: { id },
      returning: true,
    });
    if (affectedCount === 0 || !affectedRows[0]) return null;
    return affectedRows[0].dataValues as UserInterface;
  },

  deleteUser: async (id: string): Promise<boolean> => {
    const deleted = await User.destroy({ where: { id } });
    return deleted > 0;
  },

  getGlobalCategories: async (): Promise<CategoryInterface[]> => {
    const categories = await Category.findAll({ where: { userId: null } });
    return categories.map(c => c.dataValues as CategoryInterface);
  },

  createGlobalCategory: async (data: CategoryCreateInput): Promise<CategoryInterface> => {
    const category = await Category.create({ ...data, userId: null });
    return category.dataValues as CategoryInterface;
  },

  updateGlobalCategory: async (id: string, data: CategoryUpdateInput): Promise<CategoryInterface | null> => {
    const [affectedCount, affectedRows] = await Category.update(data, {
      where: { id, userId: null },
      returning: true,
    });
    if (affectedCount === 0 || !affectedRows[0]) return null;
    return affectedRows[0].dataValues as CategoryInterface;
  },

  deleteGlobalCategory: async (id: string): Promise<boolean> => {
    const deleted = await Category.destroy({ where: { id, userId: null } });
    return deleted > 0;
  },
};
