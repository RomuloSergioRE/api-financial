import { CategoryRepository } from '../repositories/category.repository.js';
import type { CategoryCreateInput, CategoryUpdateInput, CategoryDTO, CategoryInterface } from '../types/category.types.js';
import { BusinessError } from '../utils/errors.js';

const mapToCategoryDTO = (category: CategoryInterface): CategoryDTO => {
  const { deletedAt, ...categoryDto } = category;
  return categoryDto;
};

export const CategoryService = {
    create: async (userId: string, data: CategoryCreateInput, orgId?: string | null): Promise<CategoryDTO> => {
        const category = await CategoryRepository.create(userId, data, orgId);
        return mapToCategoryDTO(category);
    },

    findByUser: async (userId: string, pagination?: { offset: number; limit: number }, orgId?: string): Promise<{ rows: CategoryDTO[]; total: number }> => {
        const { rows, total } = await CategoryRepository.findByUser(userId, pagination, orgId);
        return { rows: rows.map(mapToCategoryDTO), total };
    },

    findByIdAndUser: async (id: string, userId: string, orgId?: string): Promise<CategoryDTO | null> => {
        const category = await CategoryRepository.findByIdAndUser(id, userId, orgId);
        return category ? mapToCategoryDTO(category) : null;
    },

    update: async (id: string, userId: string, data: CategoryUpdateInput, orgId?: string): Promise<CategoryDTO> => {
        const updated = await CategoryRepository.update(id, userId, data, orgId);
        if (!updated) {
            throw new BusinessError('Category not found, unauthorized, or it is a system default category', 404);
        }
        return mapToCategoryDTO(updated);
    },

    delete: async (id: string, userId: string, orgId?: string): Promise<void> => {
        const success = await CategoryRepository.delete(id, userId, orgId);
        if (!success) {
            throw new BusinessError('Category not found, unauthorized, or it is a system default category', 404);
        }
    }
};
