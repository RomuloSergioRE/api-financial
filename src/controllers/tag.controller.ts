import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { TagService } from '../services/tag.service.js';

export const TagController = {
  create: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const { name, color } = req.body as { name: string; color?: string | null };
    const tag = await TagService.create(req.user.id, {
      name,
      color: color ?? null,
    }, req.user.organizationId);
    res.status(201).json(tag);
  }),

  getAll: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const tags = await TagService.findByUser(req.user.id, req.user.organizationId);
    res.status(200).json(tags);
  }),

  getById: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const id = req.params.id as string;
    const tag = await TagService.findByIdAndUser(id, req.user.id, req.user.organizationId);
    if (!tag) {
      res.status(404).json({ error: 'Tag not found' });
      return;
    }
    res.status(200).json(tag);
  }),

  update: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const id = req.params.id as string;
    const validated = req.body as { name?: string; color?: string | null };
    const updateData: { name?: string; color?: string | null } = {};
    if (validated.name) updateData.name = validated.name;
    if (validated.color !== undefined) updateData.color = validated.color ?? null;
    const updated = await TagService.update(id, req.user.id, updateData, req.user.organizationId);
    res.status(200).json(updated);
  }),

  delete: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const id = req.params.id as string;
    await TagService.delete(id, req.user.id, req.user.organizationId);
    res.status(204).send();
  }),
};
