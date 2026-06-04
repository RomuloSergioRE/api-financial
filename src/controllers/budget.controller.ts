import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { BudgetService } from '../services/budget.service.js';
import type { BudgetUpdateInput } from '../types/budget.types.js';

export const BudgetController = {
  create: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const budget = await BudgetService.create(req.user.id, req.body, req.user.organizationId);
    res.status(201).json(budget);
  }),

  getAll: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const month = req.query.month ? Number(req.query.month) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const budgets = await BudgetService.findByUser(req.user.id, month, year, req.user.organizationId);
    res.status(200).json(budgets);
  }),

  getById: asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
  }),

  update: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const id = req.params.id as string;
    const updated = await BudgetService.update(id, req.user.id, req.body as BudgetUpdateInput, req.user.organizationId);
    res.status(200).json(updated);
  }),

  delete: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const id = req.params.id as string;
    await BudgetService.delete(id, req.user.id, req.user.organizationId);
    res.status(204).send();
  }),
};
