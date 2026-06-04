import type { Request, Response } from 'express';
import { CategoryService } from '../services/category.service.js';
import type { CategoryUpdateInput } from '../types/category.types.js';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator.js';
import { ExportService } from '../services/export.service.js';
import { ImportService } from '../services/import.service.js';
import { setCsvHeaders } from '../utils/csv.util.js';

export const CategoryController = {
    create: async (req: Request, res: Response): Promise<void> => {
        if (!req.user?.id) {
          res.status(401).json({ error: 'Unauthorized: User missing' });
          return;
        }
        const validated = createCategorySchema.parse(req.body);
        const category = await CategoryService.create(req.user.id, {
          name: validated.name,
          icon: validated.icon ?? null,
          color: validated.color ?? null,
        }, req.user.organizationId);
        res.status(201).json(category);
    },

    getAll: async (req: Request, res: Response): Promise<void> => {
        if (!req.user?.id) {
          res.status(401).json({ error: 'Unauthorized: User missing' });
          return;
        }
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
        const offset = (page - 1) * limit;

        const { rows, total } = await CategoryService.findByUser(req.user.id, { offset, limit }, req.user.organizationId);
        res.status(200).json({
            data: rows,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    },

    getById: async (req: Request, res: Response): Promise<void> => {
        if (!req.user?.id) {
          res.status(401).json({ error: 'Unauthorized: User missing' });
          return;
        }
        const id = req.params.id as string;
        const category = await CategoryService.findByIdAndUser(id, req.user.id, req.user.organizationId);
        if (!category) {
          res.status(404).json({ error: 'Category not found' });
          return;
        }
        res.status(200).json(category);
    },

    update: async (req: Request, res: Response): Promise<void> => {
        if (!req.user?.id) {
          res.status(401).json({ error: 'Unauthorized: User missing' });
          return;
        }
        const validated = updateCategorySchema.parse(req.body);
        const id = req.params.id as string;
        const updateData: CategoryUpdateInput = {};
        if (validated.name) updateData.name = validated.name;
        if (validated.icon !== undefined) updateData.icon = validated.icon ?? null;
        if (validated.color !== undefined) updateData.color = validated.color ?? null;
        const updated = await CategoryService.update(id, req.user.id, updateData, req.user.organizationId);
        res.status(200).json(updated);
    },

    delete: async (req: Request, res: Response): Promise<void> => {
        if (!req.user?.id) {
          res.status(401).json({ error: 'Unauthorized: User missing' });
          return;
        }
        const id = req.params.id as string;
        await CategoryService.delete(id, req.user.id, req.user.organizationId);
        res.status(204).send();
    },

    exportCSV: async (req: Request, res: Response): Promise<void> => {
        if (!req.user?.id) {
          res.status(401).json({ error: 'Unauthorized: User missing' });
          return;
        }
        const { content, filename } = await ExportService.exportCategoriesCSV(req.user.id, req.user.organizationId);
        setCsvHeaders(res, filename);
        res.status(200).send(content);
    },

    importCSV: async (req: Request, res: Response): Promise<void> => {
        if (!req.user?.id) {
          res.status(401).json({ error: 'Unauthorized: User missing' });
          return;
        }
        const file = req.file;
        if (!file) {
          res.status(400).json({ error: 'No file uploaded. Send a CSV file in the "file" field.' });
          return;
        }
        const result = await ImportService.importCategories(req.user.id, file.buffer, req.user.organizationId);
        if (result.errors.length > 0 && result.imported === 0) {
          res.status(422).json(result);
          return;
        }
        res.status(result.errors.length > 0 ? 207 : 200).json(result);
    },

    exportPDF: async (req: Request, res: Response): Promise<void> => {
        if (!req.user?.id) {
          res.status(401).json({ error: 'Unauthorized: User missing' });
          return;
        }
        const { buffer, filename } = await ExportService.exportCategoriesPDF(req.user.id, req.user.organizationId);
        res
            .contentType('application/pdf')
            .set('Content-Disposition', `inline; filename="${filename}"`)
            .status(200)
            .send(buffer);
    }
};
