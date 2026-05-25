import type { Request, Response } from 'express';
import { z } from 'zod';
import { AdminService } from '../services/admin.service.js';
import type { CategoryUpdateInput } from '../types/category.types.js';
import {
  updateUserStatusSchema,
  updateUserRoleSchema,
  createGlobalCategorySchema,
  updateGlobalCategorySchema,
  listUsersQuerySchema,
} from '../validators/admin.validator.js';

export const AdminController = {
  listUsers: async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, role, status, search } = listUsersQuerySchema.parse(req.query);
      const offset = (page - 1) * limit;
      const filters: { role?: string; status?: string; search?: string } = {};
      if (role) filters.role = role;
      if (status) filters.status = status;
      if (search) filters.search = search;
      const { rows, total } = await AdminService.listUsers(filters, { offset, limit });
      res.status(200).json({
        data: rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation Error', details: error.issues });
        return;
      }
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  getUserDetails: async (req: Request, res: Response): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const details = await AdminService.getUserDetails(targetId);
      if (!details) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.status(200).json(details);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  updateUserStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const { status } = updateUserStatusSchema.parse(req.body);
      const updated = await AdminService.updateUserStatus(targetId, status, req.user!.id);
      res.status(200).json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation Error', details: error.issues });
        return;
      }
      const message = error instanceof Error ? error.message : 'Internal Server Error';
      res.status(400).json({ error: message });
    }
  },

  updateUserRole: async (req: Request, res: Response): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const { role } = updateUserRoleSchema.parse(req.body);
      const updated = await AdminService.updateUserRole(targetId, role, req.user!.id);
      res.status(200).json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation Error', details: error.issues });
        return;
      }
      const message = error instanceof Error ? error.message : 'Internal Server Error';
      res.status(400).json({ error: message });
    }
  },

  deleteUser: async (req: Request, res: Response): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      await AdminService.deleteUser(targetId, req.user!.id);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal Server Error';
      res.status(400).json({ error: message });
    }
  },

  createGlobalCategory: async (req: Request, res: Response): Promise<void> => {
    try {
      const validated = createGlobalCategorySchema.parse(req.body);
      const category = await AdminService.createGlobalCategory({
        name: validated.name,
        icon: validated.icon ?? null,
        color: validated.color ?? null,
      });
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation Error', details: error.issues });
        return;
      }
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  updateGlobalCategory: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const validated = updateGlobalCategorySchema.parse(req.body);
      const updateData: CategoryUpdateInput = {};
      if (validated.name) updateData.name = validated.name;
      if (validated.icon !== undefined) updateData.icon = validated.icon ?? null;
      if (validated.color !== undefined) updateData.color = validated.color ?? null;
      const updated = await AdminService.updateGlobalCategory(id, updateData);
      if (!updated) {
        res.status(404).json({ error: 'Global category not found' });
        return;
      }
      res.status(200).json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation Error', details: error.issues });
        return;
      }
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  deleteGlobalCategory: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      await AdminService.deleteGlobalCategory(id);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal Server Error';
      res.status(400).json({ error: message });
    }
  },

  getOverview: async (req: Request, res: Response): Promise<void> => {
    try {
      const overview = await AdminService.getOverview();
      res.status(200).json(overview);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  getUserAnalytics: async (req: Request, res: Response): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const analytics = await AdminService.getUserAnalytics(targetId);
      if (!analytics) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.status(200).json(analytics);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};
