import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { GoalController } from '../controllers/goal.controller.js';
import { createGoalSchema, updateGoalSchema } from '../validators/goal.validator.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createGoalSchema), GoalController.create);
router.get('/', GoalController.getAll);
router.get('/:id', GoalController.getById);
router.put('/:id', validate(updateGoalSchema), GoalController.update);
router.delete('/:id', GoalController.delete);

export default router;
