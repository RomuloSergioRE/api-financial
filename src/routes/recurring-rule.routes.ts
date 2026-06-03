import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { RecurringRuleController } from '../controllers/recurring-rule.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/', RecurringRuleController.create);
router.get('/', RecurringRuleController.getAll);
router.get('/:id', RecurringRuleController.getById);
router.put('/:id', RecurringRuleController.update);
router.delete('/:id', RecurringRuleController.delete);
router.post('/:id/execute', RecurringRuleController.execute);

export default router;
