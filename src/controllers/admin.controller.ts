import type { Request, Response } from 'express';
import { AdminService } from '../services/admin.service.js';
import type { CategoryUpdateInput } from '../types/category.types.js';
import { ExportService } from '../services/export.service.js';
import { ImportService } from '../services/import.service.js';
import { setCsvHeaders } from '../utils/csv.util.js';

export const AdminController = {
  listUsers: async (req: Request, res: Response): Promise<void> => {
    const { page, limit, role, status, search } = req.validated as { page: number; limit: number; role?: string; status?: string; search?: string };
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
  },

  getUserDetails: async (req: Request, res: Response): Promise<void> => {
    const targetId = req.params.id as string;
    const details = await AdminService.getUserDetails(targetId);
    if (!details) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(200).json(details);
  },

  updateUserStatus: async (req: Request, res: Response): Promise<void> => {
    const targetId = req.params.id as string;
    const { status } = req.body as { status: string };
    const updated = await AdminService.updateUserStatus(targetId, status as 'active' | 'inactive' | 'suspended', req.user!.id);
    res.status(200).json(updated);
  },

  updateUserRole: async (req: Request, res: Response): Promise<void> => {
    const targetId = req.params.id as string;
    const { role } = req.body as { role: string };
    const updated = await AdminService.updateUserRole(targetId, role as 'admin' | 'user' | 'company', req.user!.id);
    res.status(200).json(updated);
  },

  deleteUser: async (req: Request, res: Response): Promise<void> => {
    const targetId = req.params.id as string;
    await AdminService.deleteUser(targetId, req.user!.id);
    res.status(204).send();
  },

  createGlobalCategory: async (req: Request, res: Response): Promise<void> => {
    const category = await AdminService.createGlobalCategory(req.body);
    res.status(201).json(category);
  },

  updateGlobalCategory: async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const updateData: CategoryUpdateInput = {};
    const validated = req.body as { name?: string; icon?: string; color?: string };
    if (validated.name) updateData.name = validated.name;
    if (validated.icon !== undefined) updateData.icon = validated.icon ?? null;
    if (validated.color !== undefined) updateData.color = validated.color ?? null;
    const updated = await AdminService.updateGlobalCategory(id, updateData);
    if (!updated) {
      res.status(404).json({ error: 'Global category not found' });
      return;
    }
    res.status(200).json(updated);
  },

  deleteGlobalCategory: async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await AdminService.deleteGlobalCategory(id);
    res.status(204).send();
  },

  getOverview: async (req: Request, res: Response): Promise<void> => {
    const overview = await AdminService.getOverview();
    res.status(200).json(overview);
  },

  getUserAnalytics: async (req: Request, res: Response): Promise<void> => {
    const targetId = req.params.id as string;
    const analytics = await AdminService.getUserAnalytics(targetId);
    if (!analytics) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(200).json(analytics);
  },

  exportUsersCSV: async (req: Request, res: Response): Promise<void> => {
    const { content, filename } = await ExportService.exportUsersCSV();
    setCsvHeaders(res, filename);
    res.status(200).send(content);
  },

  exportAllTransactionsCSV: async (req: Request, res: Response): Promise<void> => {
    const { content, filename } = await ExportService.exportAllTransactionsCSV({
      userId: req.query.userId as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    });
    setCsvHeaders(res, filename);
    res.status(200).send(content);
  },

  exportAuditLogsCSV: async (req: Request, res: Response): Promise<void> => {
    const { content, filename } = await ExportService.exportAuditLogsCSV();
    setCsvHeaders(res, filename);
    res.status(200).send(content);
  },

  importTransactionsCSV: async (req: Request, res: Response): Promise<void> => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No file uploaded. Send a CSV file in the "file" field.' });
      return;
    }
    const result = await ImportService.importTransactionsAdmin(req.user!.id, file.buffer);
    if (result.errors.length > 0 && result.imported === 0) {
      res.status(422).json(result);
      return;
    }
    res.status(result.errors.length > 0 ? 207 : 200).json(result);
  },

  listGlobalCategories: async (req: Request, res: Response): Promise<void> => {
    const categories = await AdminService.listGlobalCategories();
    res.status(200).json(categories);
  },

  listAuditLogs: async (req: Request, res: Response): Promise<void> => {
    const { page, limit, adminId, action, targetType, startDate, endDate } = req.validated as { page: number; limit: number; adminId?: string; action?: string; targetType?: string; startDate?: string; endDate?: string };
    const offset = (page - 1) * limit;
    const filters: { adminId?: string; action?: string; targetType?: string; startDate?: string; endDate?: string } = {};
    if (adminId) filters.adminId = adminId;
    if (action) filters.action = action;
    if (targetType) filters.targetType = targetType;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    const { rows, total } = await AdminService.listAuditLogs(filters, { offset, limit });
    res.status(200).json({
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  },

  getUserGrowth: async (req: Request, res: Response): Promise<void> => {
    const { startDate, endDate, granularity } = req.validated as { startDate: string; endDate: string; granularity: 'day' | 'month' };
    const data = await AdminService.getUserGrowth(startDate, endDate, granularity);
    res.status(200).json(data);
  },

  getPerformance: async (req: Request, res: Response): Promise<void> => {
    const data = await AdminService.getPerformance();
    res.status(200).json(data);
  },
};
