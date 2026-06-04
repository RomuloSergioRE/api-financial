import type { Request, Response } from 'express';
import { BudgetService } from '../services/budget.service.js';
import { createBudgetSchema, updateBudgetSchema } from '../validators/budget.validator.js';
import type { BudgetUpdateInput } from '../types/budget.types.js';

export const BudgetController = {
  create: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const validated = createBudgetSchema.parse(req.body);
    const budget = await BudgetService.create(req.user.id, validated, req.user.organizationId);
    res.status(201).json(budget);
  },

  getAll: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const month = req.query.month ? Number(req.query.month) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const budgets = await BudgetService.findByUser(req.user.id, month, year, req.user.organizationId);
    res.status(200).json(budgets);
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const id = req.params.id as string;
    const budget = await BudgetService.findByIdAndUser(id, req.user.id, req.user.organizationId);
    if (!budget) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }
    res.status(200).json(budget);
  },

  update: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const validated = updateBudgetSchema.parse(req.body) as BudgetUpdateInput;
    const id = req.params.id as string;
    const updated = await BudgetService.update(id, req.user.id, validated, req.user.organizationId);
    res.status(200).json(updated);
  },

  delete: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const id = req.params.id as string;
    await BudgetService.delete(id, req.user.id, req.user.organizationId);
    res.status(204).send();
  },
};
