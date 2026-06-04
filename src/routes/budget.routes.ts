import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { BudgetController } from '../controllers/budget.controller.js';
import { createBudgetSchema, updateBudgetSchema } from '../validators/budget.validator.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createBudgetSchema), BudgetController.create);
router.get('/', BudgetController.getAll);
router.get('/:id', BudgetController.getById);
router.put('/:id', validate(updateBudgetSchema), BudgetController.update);
router.delete('/:id', BudgetController.delete);

export default router;
