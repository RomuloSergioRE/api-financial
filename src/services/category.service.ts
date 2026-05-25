import { CategoryRepository } from '../repositories/category.repository.js';
import type { CategoryCreateInput, CategoryUpdateInput, CategoryDTO, CategoryInterface } from '../types/category.types.js';

const mapToCategoryDTO = (category: CategoryInterface): CategoryDTO => {
  const { deletedAt, ...categoryDto } = category;
  return categoryDto;
};

export const CategoryService = {
    create: async (userId: string, data: CategoryCreateInput): Promise<CategoryDTO> => {
        const category = await CategoryRepository.create(userId, data);
        return mapToCategoryDTO(category);
    },

    findByUser: async (userId: string, pagination?: { offset: number; limit: number }): Promise<{ rows: CategoryDTO[]; total: number }> => {
        const { rows, total } = await CategoryRepository.findByUser(userId, pagination);
        return { rows: rows.map(mapToCategoryDTO), total };
    },

    findByIdAndUser: async (id: string, userId: string): Promise<CategoryDTO | null> => {
        const category = await CategoryRepository.findByIdAndUser(id, userId);
        return category ? mapToCategoryDTO(category) : null;
    },

    update: async (id: string, userId: string, data: CategoryUpdateInput): Promise<CategoryDTO> => {
        const updated = await CategoryRepository.update(id, userId, data);
        if (!updated) {
            throw new Error('Category not found, unauthorized, or it is a system default category');
        }
        return mapToCategoryDTO(updated);
    },

    delete: async (id: string, userId: string): Promise<void> => {
        const success = await CategoryRepository.delete(id, userId);
        if (!success) {
            throw new Error('Category not found, unauthorized, or it is a system default category');
        }
    }
};