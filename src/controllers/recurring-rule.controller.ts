import type { Request, Response } from 'express';
import { RecurringRuleService } from '../services/recurring-rule.service.js';
import { createRecurringRuleSchema, updateRecurringRuleSchema } from '../validators/recurring-rule.validator.js';
import type { RecurringRuleCreateInput, RecurringRuleUpdateInput } from '../types/recurring-rule.types.js';

export const RecurringRuleController = {
  create: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const validated = createRecurringRuleSchema.parse(req.body);
    const data: RecurringRuleCreateInput = {
      categoryId: validated.categoryId,
      description: validated.description,
      amount: validated.amount,
      type: validated.type,
      frequency: validated.frequency,
      interval: validated.interval,
      nextDate: validated.nextDate,
      endDate: validated.endDate ?? null,
    };
    const rule = await RecurringRuleService.create(req.user.id, data, req.user.organizationId);
    res.status(201).json(rule);
  },

  getAll: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const active = req.query.active !== undefined ? req.query.active === 'true' : undefined;
    const rules = await RecurringRuleService.findByUser(req.user.id, active, req.user.organizationId);
    res.status(200).json(rules);
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const id = req.params.id as string;
    const rule = await RecurringRuleService.findByIdAndUser(id, req.user.id, req.user.organizationId);
    if (!rule) {
      res.status(404).json({ error: 'Recurring rule not found' });
      return;
    }
    res.status(200).json(rule);
  },

  update: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const validated = updateRecurringRuleSchema.parse(req.body) as RecurringRuleUpdateInput;
    const id = req.params.id as string;
    const updated = await RecurringRuleService.update(id, req.user.id, validated, req.user.organizationId);
    res.status(200).json(updated);
  },

  delete: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const id = req.params.id as string;
    await RecurringRuleService.delete(id, req.user.id, req.user.organizationId);
    res.status(204).send();
  },

  execute: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const id = req.params.id as string;
    const result = await RecurringRuleService.executeRule(id, req.user.id, req.user.organizationId);
    res.status(200).json(result);
  },
};
