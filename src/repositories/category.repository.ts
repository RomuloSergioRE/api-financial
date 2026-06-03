import { Op } from 'sequelize';
import { Category } from '../models/index.js';
import type { CategoryInterface, CategoryCreateInput, CategoryUpdateInput } from '../types/category.types.js';

const GLOBAL_USER_ID = null;

export const CategoryRepository = {
    create: async (userId: string | null, data: CategoryCreateInput, orgId?: string | null): Promise<CategoryInterface> => {
        const category = await Category.create({ ...data, userId, organizationId: orgId || null });
        return category.dataValues as CategoryInterface;
    },

    findByUser: async (userId: string, pagination?: { offset: number; limit: number }, orgId?: string): Promise<{ rows: CategoryInterface[]; total: number }> => {
        const orConditions: Array<Record<string, unknown>> = [];

        if (orgId) {
          orConditions.push({ organizationId: orgId });
          orConditions.push({ userId: GLOBAL_USER_ID });
        } else {
          orConditions.push({ userId });
          orConditions.push({ userId: GLOBAL_USER_ID });
        }

        const where: Record<string, unknown> = { [Op.or]: orConditions };

        if (!orgId) {
          where.organizationId = null;
        }

        const { rows, count } = await Category.findAndCountAll({
          where,
          order: [['name', 'ASC']],
          offset: pagination?.offset ?? 0,
          limit: pagination?.limit ?? 20,
          distinct: true,
        });
        return { rows: rows.map(category => category.dataValues as CategoryInterface), total: count };
    },

    findByIdAndUser: async (id: string, userId: string, orgId?: string): Promise<CategoryInterface | null> => {
        const orConditions: Array<Record<string, unknown>> = [];

        if (orgId) {
          orConditions.push({ organizationId: orgId, userId });
          orConditions.push({ userId: GLOBAL_USER_ID });
        } else {
          orConditions.push({ userId });
          orConditions.push({ userId: GLOBAL_USER_ID });
        }

        const category = await Category.findOne({
          where: {
            id,
            [Op.or]: orConditions,
          },
        });
        return category ? (category.dataValues as CategoryInterface) : null;
    },

  update: async (id: string, userId: string, data: CategoryUpdateInput, orgId?: string): Promise<CategoryInterface | null> => {
    const where: Record<string, unknown> = { id };

    if (orgId) {
      where.organizationId = orgId;
      where.userId = userId;
    } else {
      where.userId = userId;
    }

    const [affectedCount, affectedRows] = await Category.update(data, {
      where,
      returning: true,
    });
    if (affectedCount === 0 || !affectedRows[0]) return null;
    return affectedRows[0].dataValues as CategoryInterface;
  },

  delete: async (id: string, userId: string, orgId?: string): Promise<boolean> => {
    const where: Record<string, unknown> = { id };

    if (orgId) {
      where.organizationId = orgId;
      where.userId = userId;
    } else {
      where.userId = userId;
    }

    const deletedRows = await Category.destroy({ where });
    return deletedRows > 0;
  }
};
