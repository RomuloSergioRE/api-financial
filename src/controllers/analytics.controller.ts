import type { Request, Response } from 'express';
import { z } from 'zod';
import { AnalyticsService } from '../services/analytics.service.js';
import { handleControllerError } from '../utils/errors.js';

const analyticsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional(),
  categoryId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Invalid UUID").optional(),
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
  }
};