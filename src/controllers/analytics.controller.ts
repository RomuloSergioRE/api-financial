import type { Request, Response } from 'express';
import { z } from 'zod';
import { AnalyticsService } from '../services/analytics.service.js';
import type { AnalyticsFilterInput } from '../types/analytics.types.js';
import { handleControllerError } from '../utils/errors.js';
import { ExportService } from '../services/export.service.js';
import { setCsvHeaders } from '../utils/csv.util.js';

const analyticsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional(),
  categoryId: z.string().uuid("Invalid UUID").optional(),
});

const monthYearSchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export const AnalyticsController = {
  getBalance: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'Unauthorized: User identity missing.' });
        return;
      }

      const validatedQuery = analyticsQuerySchema.parse(req.query);
      const userId = req.user.id as string;

      const balanceData = await AnalyticsService.getBalanceSummary(userId, validatedQuery);

      res.status(200).json(balanceData);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  getCategoryShare: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'Unauthorized: User identity missing.' });
        return;
      }

      const validatedQuery = analyticsQuerySchema.parse(req.query);
      const userId = req.user.id as string;

      const distributionData = await AnalyticsService.getCategoryDistribution(userId, validatedQuery);

      res.status(200).json(distributionData);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  getMonthlySeries: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'Unauthorized: User identity missing.' });
        return;
      }

      const validatedQuery = analyticsQuerySchema.parse(req.query);
      const userId = req.user.id as string;

      const data = await AnalyticsService.getMonthlySeries(userId, validatedQuery);
      res.status(200).json(data);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  getComparison: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'Unauthorized: User identity missing.' });
        return;
      }

      const { month, year } = monthYearSchema.parse(req.query);
      const userId = req.user.id as string;

      const data = await AnalyticsService.getComparison(userId, month, year);
      res.status(200).json(data);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  getTopCategories: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'Unauthorized: User identity missing.' });
        return;
      }

      const validatedQuery = analyticsQuerySchema.parse(req.query);
      const limit = req.query.limit ? z.coerce.number().int().positive().parse(req.query.limit) : 5;
      const userId = req.user.id as string;

      const data = await AnalyticsService.getTopCategories(userId, validatedQuery, limit);
      res.status(200).json(data);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  getExecutiveSummary: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'Unauthorized: User identity missing.' });
        return;
      }

      const { month, year } = monthYearSchema.parse(req.query);
      const userId = req.user.id as string;

      const data = await AnalyticsService.getExecutiveSummary(userId, month, year);
      res.status(200).json(data);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  getCashFlowProjection: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'Unauthorized: User identity missing.' });
        return;
      }

      const months = req.query.months ? z.coerce.number().int().positive().max(12).parse(req.query.months) : 3;
      const userId = req.user.id as string;

      const data = await AnalyticsService.getCashFlowProjection(userId, months);
      res.status(200).json(data);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  exportCSV: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'Unauthorized: User identity missing.' });
        return;
      }

      const validatedQuery = analyticsQuerySchema.parse(req.query);
      const userId = req.user.id as string;

      const { content, filename } = await ExportService.exportAnalyticsCSV(userId, validatedQuery);
      setCsvHeaders(res, filename);
      res.status(200).send(content);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  exportPDF: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'Unauthorized: User identity missing.' });
        return;
      }

      const validatedQuery = analyticsQuerySchema.parse(req.query);
      const userId = req.user.id as string;

      const { buffer, filename } = await ExportService.exportAnalyticsPDF(userId, validatedQuery);

      res
        .contentType('application/pdf')
        .set('Content-Disposition', `inline; filename="${filename}"`)
        .status(200)
        .send(buffer);
    } catch (error) {
      handleControllerError(res, error);
    }
  },
};
