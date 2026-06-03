import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { BudgetController } from '../controllers/budget.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/', BudgetController.create);
router.get('/', BudgetController.getAll);
router.get('/:id', BudgetController.getById);
router.put('/:id', BudgetController.update);
router.delete('/:id', BudgetController.delete);

export default router;
