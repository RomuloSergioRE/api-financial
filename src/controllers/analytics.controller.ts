import type { Request, Response } from 'express';
import { z } from 'zod';
import { AnalyticsService } from '../services/analytics.service.js';
import { ExportService } from '../services/export.service.js';
import { setCsvHeaders } from '../utils/csv.util.js';
import { analyticsQuerySchema, monthYearSchema } from '../validators/analytics.validator.js';

export const AnalyticsController = {
  getBalance: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User identity missing.' });
      return;
    }
    const balanceData = await AnalyticsService.getBalanceSummary(req.user.id, req.validated as Record<string, unknown>);
    res.status(200).json(balanceData);
  },

  getCategoryShare: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User identity missing.' });
      return;
    }
    const distributionData = await AnalyticsService.getCategoryDistribution(req.user.id, req.validated as Record<string, unknown>);
    res.status(200).json(distributionData);
  },

  getMonthlySeries: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User identity missing.' });
      return;
    }
    const data = await AnalyticsService.getMonthlySeries(req.user.id, req.validated as Record<string, unknown>);
    res.status(200).json(data);
  },

  getComparison: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User identity missing.' });
      return;
    }
    const { month, year } = req.validated as { month?: number; year?: number };
    const data = await AnalyticsService.getComparison(req.user.id, month, year);
    res.status(200).json(data);
  },

  getTopCategories: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User identity missing.' });
      return;
    }
    const validatedQuery = req.validated as Record<string, unknown>;
    const limit = req.query.limit ? z.coerce.number().int().positive().parse(req.query.limit) : 5;
    const data = await AnalyticsService.getTopCategories(req.user.id, validatedQuery, limit);
    res.status(200).json(data);
  },

  getExecutiveSummary: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User identity missing.' });
      return;
    }
    const { month, year } = req.validated as { month?: number; year?: number };
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
    const { content, filename } = await ExportService.exportAnalyticsCSV(req.user.id, req.validated as Record<string, unknown>);
    setCsvHeaders(res, filename);
    res.status(200).send(content);
  },

  exportPDF: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User identity missing.' });
      return;
    }
    const { buffer, filename } = await ExportService.exportAnalyticsPDF(req.user.id, req.validated as Record<string, unknown>);
    res
      .contentType('application/pdf')
      .set('Content-Disposition', `inline; filename="${filename}"`)
      .status(200)
      .send(buffer);
  },
};
