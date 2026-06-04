import type { Request, Response } from 'express';
import { GoalService } from '../services/goal.service.js';
import { createGoalSchema, updateGoalSchema } from '../validators/goal.validator.js';
import type { GoalUpdateInput } from '../types/goal.types.js';

export const GoalController = {
  create: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const validated = createGoalSchema.parse(req.body);
    const data = {
      name: validated.name,
      targetAmount: validated.targetAmount,
      categoryId: validated.categoryId ?? null,
      deadline: validated.deadline ?? null,
    };
    const goal = await GoalService.create(req.user.id, data, req.user.organizationId);
    res.status(201).json(goal);
  },

  getAll: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const goals = await GoalService.findByUser(req.user.id, req.user.organizationId);
    res.status(200).json(goals);
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const id = req.params.id as string;
    const goal = await GoalService.findByIdAndUser(id, req.user.id, req.user.organizationId);
    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }
    res.status(200).json(goal);
  },

  update: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const validated = updateGoalSchema.parse(req.body) as GoalUpdateInput;
    const id = req.params.id as string;
    const updated = await GoalService.update(id, req.user.id, validated, req.user.organizationId);
    res.status(200).json(updated);
  },

  delete: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const id = req.params.id as string;
    await GoalService.delete(id, req.user.id, req.user.organizationId);
    res.status(204).send();
  },
};
