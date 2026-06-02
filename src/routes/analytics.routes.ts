import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js'; 

const router = Router();

router.use(authMiddleware);

router.get('/balance', AnalyticsController.getBalance);
router.get('/categories', AnalyticsController.getCategoryShare);
router.get('/export/csv', AnalyticsController.exportCSV);
router.get('/export/pdf', AnalyticsController.exportPDF);

export default router;