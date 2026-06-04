import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js'; 
import { validate } from '../middlewares/validation.middleware.js';
import { exportLimiter } from '../middlewares/export-limiter.js';
import { analyticsQuerySchema, monthYearSchema } from '../validators/analytics.validator.js';

const router = Router();

router.use(authMiddleware);

router.get('/balance', validate(analyticsQuerySchema, 'query'), AnalyticsController.getBalance);
router.get('/categories', validate(analyticsQuerySchema, 'query'), AnalyticsController.getCategoryShare);
router.get('/monthly-series', validate(analyticsQuerySchema, 'query'), AnalyticsController.getMonthlySeries);
router.get('/comparison', validate(monthYearSchema, 'query'), AnalyticsController.getComparison);
router.get('/top-categories', validate(analyticsQuerySchema, 'query'), AnalyticsController.getTopCategories);
router.get('/summary', validate(monthYearSchema, 'query'), AnalyticsController.getExecutiveSummary);
router.get('/cash-flow', AnalyticsController.getCashFlowProjection);
router.get('/export/csv', exportLimiter, validate(analyticsQuerySchema, 'query'), AnalyticsController.exportCSV);
router.get('/export/pdf', exportLimiter, validate(analyticsQuerySchema, 'query'), AnalyticsController.exportPDF);

export default router;