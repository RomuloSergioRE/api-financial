import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorization.middleware.js';
import { exportLimiter } from '../middlewares/export-limiter.js';
import { AdminController } from '../controllers/admin.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authMiddleware);
router.use(authorize('admin'));

// User management
router.get('/users', AdminController.listUsers);
router.get('/users/:id', AdminController.getUserDetails);
router.patch('/users/:id/status', AdminController.updateUserStatus);
router.patch('/users/:id/role', AdminController.updateUserRole);
router.delete('/users/:id', AdminController.deleteUser);

// Global categories
router.get('/categories', AdminController.listGlobalCategories);
router.post('/categories', AdminController.createGlobalCategory);
router.put('/categories/:id', AdminController.updateGlobalCategory);
router.delete('/categories/:id', AdminController.deleteGlobalCategory);

// Audit logs
router.get('/audit-logs', AdminController.listAuditLogs);

// Platform analytics
router.get('/analytics/overview', AdminController.getOverview);
router.get('/analytics/users/:id', AdminController.getUserAnalytics);
router.get('/analytics/user-growth', AdminController.getUserGrowth);
router.get('/analytics/performance', AdminController.getPerformance);

// Exports
router.get('/export/users/csv', exportLimiter, AdminController.exportUsersCSV);
router.get('/export/transactions/csv', exportLimiter, AdminController.exportAllTransactionsCSV);
router.get('/export/audit-logs/csv', exportLimiter, AdminController.exportAuditLogsCSV);

// Imports
router.post('/import/transactions/csv', upload.single('file'), AdminController.importTransactionsCSV);

export default router;
