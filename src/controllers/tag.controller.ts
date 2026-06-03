import type { Request, Response } from 'express';
import { TagService } from '../services/tag.service.js';
import { createTagSchema, updateTagSchema } from '../validators/tag.validator.js';
import { handleControllerError } from '../utils/errors.js';

export const TagController = {
  create: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'Unauthorized: User missing' });
        return;
      }
      const validated = createTagSchema.parse(req.body);
      const tag = await TagService.create(req.user.id, {
        name: validated.name,
        color: validated.color ?? null,
      });
      res.status(201).json(tag);
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
      const tags = await TagService.findByUser(req.user.id);
      res.status(200).json(tags);
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
      const tag = await TagService.findByIdAndUser(id, req.user.id);
      if (!tag) {
        res.status(404).json({ error: 'Tag not found' });
        return;
      }
      res.status(200).json(tag);
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
      const validated = updateTagSchema.parse(req.body);
      const id = req.params.id as string;
      const updateData: { name?: string; color?: string | null } = {};
      if (validated.name) updateData.name = validated.name;
      if (validated.color !== undefined) updateData.color = validated.color ?? null;
      const updated = await TagService.update(id, req.user.id, updateData);
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
      await TagService.delete(id, req.user.id);
      res.status(204).send();
    } catch (error) {
      handleControllerError(res, error);
    }
  },
};
