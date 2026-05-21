import { Op } from 'sequelize';
import { Category } from '../models/index.js';
import type { CategoryInterface, CategoryCreateInput, CategoryUpdateInput } from '../types/category.types.js';

export const CategoryRepository = {
    create: async (userId: string | null, data: CategoryCreateInput): Promise<CategoryInterface> => {
        const category = await Category.create({ ...data, userId });
        return category.dataValues as CategoryInterface;
    },

    findByUser: async (userId: string): Promise<CategoryInterface[]> => {
        const categories = await Category.findAll({
        where: {
            [Op.or]: [
                { userId: userId },
                { userId: null }
            ]
        },
        order: [['name', 'ASC']]
        });
        return categories.map(category => category.dataValues as CategoryInterface);
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
        const category = await Category.findOne({ where: { id, userId } });
        if (!category) return null;
        await category.update(data);
        return category.dataValues as CategoryInterface;
    },

    delete: async (id: string, userId: string): Promise<boolean> => {
        const deletedRows = await Category.destroy({ where: { id, userId } });
        return deletedRows > 0;
    }
};