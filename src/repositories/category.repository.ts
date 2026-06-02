import { Op } from 'sequelize';
import { Category } from '../models/index.js';
import type { CategoryInterface, CategoryCreateInput, CategoryUpdateInput } from '../types/category.types.js';

export const CategoryRepository = {
    create: async (userId: string | null, data: CategoryCreateInput): Promise<CategoryInterface> => {
        const category = await Category.create({ ...data, userId });
        return category.dataValues as CategoryInterface;
    },

    findByUser: async (userId: string, pagination?: { offset: number; limit: number }): Promise<{ rows: CategoryInterface[]; total: number }> => {
        const { rows, count } = await Category.findAndCountAll({
        where: {
            [Op.or]: [
                { userId: userId },
                { userId: null }
            ]
        },
        order: [['name', 'ASC']],
        offset: pagination?.offset ?? 0,
        limit: pagination?.limit ?? 20,
        distinct: true,
        });
        return { rows: rows.map(category => category.dataValues as CategoryInterface), total: count };
    },

    findByIdAndUser: async (id: string, userId: string): Promise<CategoryInterface | null> => {
        const category = await Category.findOne({
        where: {
            id,
            [Op.or]: [
                { userId: userId }, 
                { userId: null }
            ]
        }
        });
        return category ? (category.dataValues as CategoryInterface) : null;
    },

  update: async (id: string, userId: string, data: CategoryUpdateInput): Promise<CategoryInterface | null> => {
    const [affectedCount, affectedRows] = await Category.update(data, {
      where: { id, userId },
      returning: true,
    });
    if (affectedCount === 0 || !affectedRows[0]) return null;
    return affectedRows[0].dataValues as CategoryInterface;
  },

  delete: async (id: string, userId: string): Promise<boolean> => {
    const deletedRows = await Category.destroy({ where: { id, userId } });
    return deletedRows > 0;
  }
};