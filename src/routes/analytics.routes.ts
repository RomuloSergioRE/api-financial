import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js'; 

const router = Router();

router.use(authMiddleware);

router.get('/balance', AnalyticsController.getBalance);
router.get('/categories', AnalyticsController.getCategoryShare);

export default router;