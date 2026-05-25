import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorization.middleware.js';
import { AdminController } from '../controllers/admin.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(authorize('admin'));

// User management
router.get('/users', AdminController.listUsers);
router.get('/users/:id', AdminController.getUserDetails);
router.patch('/users/:id/status', AdminController.updateUserStatus);
router.patch('/users/:id/role', AdminController.updateUserRole);
router.delete('/users/:id', AdminController.deleteUser);

// Global categories
router.post('/categories', AdminController.createGlobalCategory);
router.put('/categories/:id', AdminController.updateGlobalCategory);
router.delete('/categories/:id', AdminController.deleteGlobalCategory);

// Platform analytics
router.get('/analytics/overview', AdminController.getOverview);
router.get('/analytics/users/:id', AdminController.getUserAnalytics);

export default router;
