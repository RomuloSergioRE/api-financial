import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { GoalController } from '../controllers/goal.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/', GoalController.create);
router.get('/', GoalController.getAll);
router.get('/:id', GoalController.getById);
router.put('/:id', GoalController.update);
router.delete('/:id', GoalController.delete);

export default router;
