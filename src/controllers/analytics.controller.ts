import type { Request, Response } from 'express';
import { z } from 'zod';
import { AnalyticsService } from '../services/analytics.service.js';
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
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User identity missing.' });
      return;
    }
    const validatedQuery = analyticsQuerySchema.parse(req.query);
    const balanceData = await AnalyticsService.getBalanceSummary(req.user.id, validatedQuery);
    res.status(200).json(balanceData);
  },

  getCategoryShare: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User identity missing.' });
      return;
    }
    const validatedQuery = analyticsQuerySchema.parse(req.query);
    const distributionData = await AnalyticsService.getCategoryDistribution(req.user.id, validatedQuery);
    res.status(200).json(distributionData);
  },

  getMonthlySeries: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User identity missing.' });
      return;
    }
    const validatedQuery = analyticsQuerySchema.parse(req.query);
    const data = await AnalyticsService.getMonthlySeries(req.user.id, validatedQuery);
    res.status(200).json(data);
  },

  getComparison: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User identity missing.' });
      return;
    }
    const { month, year } = monthYearSchema.parse(req.query);
    const data = await AnalyticsService.getComparison(req.user.id, month, year);
    res.status(200).json(data);
  },

  getTopCategories: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User identity missing.' });
      return;
    }
    const validatedQuery = analyticsQuerySchema.parse(req.query);
    const limit = req.query.limit ? z.coerce.number().int().positive().parse(req.query.limit) : 5;
    const data = await AnalyticsService.getTopCategories(req.user.id, validatedQuery, limit);
    res.status(200).json(data);
  },

  getExecutiveSummary: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User identity missing.' });
      return;
    }
    const { month, year } = monthYearSchema.parse(req.query);
    const data = await AnalyticsService.getExecutiveSummary(req.user.id, month, year);
    res.status(200).json(data);
  },

  getCashFlowProjection: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User identity missing.' });
      return;
    }
    const months = req.query.months ? z.coerce.number().int().positive().max(12).parse(req.query.months) : 3;
    const data = await AnalyticsService.getCashFlowProjection(req.user.id, months);
    res.status(200).json(data);
  },

  exportCSV: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User identity missing.' });
      return;
    }
    const validatedQuery = analyticsQuerySchema.parse(req.query);
    const { content, filename } = await ExportService.exportAnalyticsCSV(req.user.id, validatedQuery);
    setCsvHeaders(res, filename);
    res.status(200).send(content);
  },

  exportPDF: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User identity missing.' });
      return;
    }
    const validatedQuery = analyticsQuerySchema.parse(req.query);
    const { buffer, filename } = await ExportService.exportAnalyticsPDF(req.user.id, validatedQuery);
    res
      .contentType('application/pdf')
      .set('Content-Disposition', `inline; filename="${filename}"`)
      .status(200)
      .send(buffer);
  },
};
