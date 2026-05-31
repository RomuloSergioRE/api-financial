import type { Request, Response } from 'express';
import { CategoryService } from '../services/category.service.js';
import type { CategoryUpdateInput } from '../types/category.types.js';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator.js';
import { handleControllerError } from '../utils/errors.js';

export const CategoryController = {
    create: async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.user?.id) {
                res.status(401).json({ error: 'Unauthorized: User missing' });
                return;
            }

            const validated = createCategorySchema.parse(req.body);
            const userId = req.user.id;
            const category = await CategoryService.create(userId, {
              name: validated.name,
              icon: validated.icon ?? null,
              color: validated.color ?? null,
            });
            res.status(201).json(category);
        } catch (error) {
            handleControllerError(res, error);
        }
    },

    getAll: async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.user?.id) {
                res.status(401).json({ error: 'Unauthorized: User missing' });
                return;
            }

            const userId = req.user.id;
            const page = Math.max(1, parseInt(req.query.page as string) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
            const offset = (page - 1) * limit;

            const { rows, total } = await CategoryService.findByUser(userId, { offset, limit });
            res.status(200).json({
                data: rows,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            });
        } catch (error) {
            handleControllerError(res, error);
        }
    },

    getById: async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.user?.id) {
                res.status(401).json({ error: 'Unauthorized: User missing' });
                return;
            }

            const id = req.params.id as string;
            const userId = req.user.id;
            const category = await CategoryService.findByIdAndUser(id, userId);

            if (!category) {
                res.status(404).json({ error: 'Category not found' });
                return;
            }

            res.status(200).json(category);
        } catch (error) {
            handleControllerError(res, error);
        }
    },

    update: async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.user?.id) {
                res.status(401).json({ error: 'Unauthorized: User missing' });
                return;
            }

            const validated = updateCategorySchema.parse(req.body);
            const id = req.params.id as string;
            const userId = req.user.id;
            const updateData: CategoryUpdateInput = {};
            if (validated.name) updateData.name = validated.name;
            if (validated.icon !== undefined) updateData.icon = validated.icon ?? null;
            if (validated.color !== undefined) updateData.color = validated.color ?? null;
            const updated = await CategoryService.update(id, userId, updateData);
            
            res.status(200).json(updated);
        } catch (error) {
            handleControllerError(res, error);
        }
    },

    delete: async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.user?.id) {
                res.status(401).json({ error: 'Unauthorized: User missing' });
                return;
            }

            const id = req.params.id as string;
            const userId = req.user.id;
            await CategoryService.delete(id, userId);
            
            res.status(204).send();
        } catch (error) {
            handleControllerError(res, error);
        }
    } 
};