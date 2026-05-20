import type { Request, Response } from 'express';
import { CategoryService } from '../services/category.service.js';

export const CategoryController = {
    create: async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.user || !req.user.id) {
                res.status(401).json({ error: 'Unauthorized: User missing' });
                return;
            }
            if (!req.body.name || req.body.name.trim() === '') {
                res.status(400).json({ error: 'Category name is required' });
                return;
            }

            const userId = req.user.id as string;
            const category = await CategoryService.create(userId, req.body);
            res.status(201).json(category);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    },

    getAll: async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.user || !req.user.id) {
                res.status(401).json({ error: 'Unauthorized: User missing' });
                return;
            }

            const userId = req.user.id as string;
            const categories = await CategoryService.findByUser(userId);
            res.status(200).json(categories);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    },

    getById: async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.user || !req.user.id) {
                res.status(401).json({ error: 'Unauthorized: User missing' });
                return;
            }

            const id = req.params.id as string;
            const userId = req.user.id as string;
            const category = await CategoryService.findByIdAndUser(id, userId);

            if (!category) {
                res.status(404).json({ error: 'Category not found' });
                return;
            }

            res.status(200).json(category);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    },

    update: async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.user || !req.user.id) {
                res.status(401).json({ error: 'Unauthorized: User missing' });
                return;
            }

            const id = req.params.id as string;
            const userId = req.user.id as string;
            const updated = await CategoryService.update(id, userId, req.body);
            
            res.status(200).json(updated);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    },

    delete: async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.user || !req.user.id) {
                res.status(401).json({ error: 'Unauthorized: User missing' });
                return;
            }

            const id = req.params.id as string;
            const userId = req.user.id as string;
            await CategoryService.delete(id, userId);
            
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    } 
};