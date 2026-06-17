import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requirePlan } from '../middlewares/plan.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { BudgetController } from '../controllers/budget.controller.js';
import { createBudgetSchema, updateBudgetSchema } from '../validators/budget.validator.js';

const router = Router();

router.use(authMiddleware);

router.post('/', requirePlan('pro'), validate(createBudgetSchema), BudgetController.create);
router.get('/', BudgetController.getAll);
router.get('/:id', BudgetController.getById);
router.put('/:id', requirePlan('pro'), validate(updateBudgetSchema), BudgetController.update);
router.delete('/:id', requirePlan('pro'), BudgetController.delete);

export default router;
