import type { Request, Response } from 'express';
import { GoalService } from '../services/goal.service.js';
import { createGoalSchema, updateGoalSchema } from '../validators/goal.validator.js';
import type { GoalUpdateInput } from '../types/goal.types.js';
import { handleControllerError } from '../utils/errors.js';

export const GoalController = {
  create: async (req: Request, res: Response): Promise<void> => {
    try {
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
      const goal = await GoalService.create(req.user.id, data);
      res.status(201).json(goal);
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
      const goals = await GoalService.findByUser(req.user.id);
      res.status(200).json(goals);
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
      const goal = await GoalService.findByIdAndUser(id, req.user.id);
      if (!goal) {
        res.status(404).json({ error: 'Goal not found' });
        return;
      }
      res.status(200).json(goal);
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
      const validated = updateGoalSchema.parse(req.body) as GoalUpdateInput;
      const id = req.params.id as string;
      const updated = await GoalService.update(id, req.user.id, validated);
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
      await GoalService.delete(id, req.user.id);
      res.status(204).send();
    } catch (error) {
      handleControllerError(res, error);
    }
  },
};
