import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorization.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { exportLimiter } from '../middlewares/export-limiter.js';
import { AdminController } from '../controllers/admin.controller.js';
import { updateUserStatusSchema, updateUserRoleSchema, updateUserPlanSchema, createGlobalCategorySchema, updateGlobalCategorySchema, listUsersQuerySchema, auditLogsQuerySchema, userGrowthQuerySchema } from '../validators/admin.validator.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authMiddleware);
router.use(authorize('admin'));

// User management
router.get('/users', validate(listUsersQuerySchema, 'query'), AdminController.listUsers);
router.get('/users/:id', AdminController.getUserDetails);
router.patch('/users/:id/status', validate(updateUserStatusSchema), AdminController.updateUserStatus);
router.patch('/users/:id/role', validate(updateUserRoleSchema), AdminController.updateUserRole);
router.patch('/users/:id/plan', validate(updateUserPlanSchema), AdminController.updateUserPlan);
router.delete('/users/:id', AdminController.deleteUser);

// Global categories
router.get('/categories', AdminController.listGlobalCategories);
router.post('/categories', validate(createGlobalCategorySchema), AdminController.createGlobalCategory);
router.put('/categories/:id', validate(updateGlobalCategorySchema), AdminController.updateGlobalCategory);
router.delete('/categories/:id', AdminController.deleteGlobalCategory);

// Audit logs
router.get('/audit-logs', validate(auditLogsQuerySchema, 'query'), AdminController.listAuditLogs);

// Platform analytics
router.get('/analytics/overview', AdminController.getOverview);
router.get('/analytics/users/:id', AdminController.getUserAnalytics);
router.get('/analytics/user-growth', validate(userGrowthQuerySchema, 'query'), AdminController.getUserGrowth);
router.get('/analytics/performance', AdminController.getPerformance);

// Exports
router.get('/export/users/csv', exportLimiter, AdminController.exportUsersCSV);
router.get('/export/transactions/csv', exportLimiter, AdminController.exportAllTransactionsCSV);
router.get('/export/audit-logs/csv', exportLimiter, AdminController.exportAuditLogsCSV);

// Imports
router.post('/import/transactions/csv', upload.single('file'), AdminController.importTransactionsCSV);

export default router;
