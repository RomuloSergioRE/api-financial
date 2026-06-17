import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requirePlan } from '../middlewares/plan.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { RecurringRuleController } from '../controllers/recurring-rule.controller.js';
import { createRecurringRuleSchema, updateRecurringRuleSchema } from '../validators/recurring-rule.validator.js';

const router = Router();

router.use(authMiddleware);

router.post('/', requirePlan('pro'), validate(createRecurringRuleSchema), RecurringRuleController.create);
router.get('/', RecurringRuleController.getAll);
router.get('/:id', RecurringRuleController.getById);
router.put('/:id', requirePlan('pro'), validate(updateRecurringRuleSchema), RecurringRuleController.update);
router.delete('/:id', requirePlan('pro'), RecurringRuleController.delete);
router.post('/:id/execute', requirePlan('pro'), RecurringRuleController.execute);

export default router;
