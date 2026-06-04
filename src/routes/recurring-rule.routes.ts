import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { RecurringRuleController } from '../controllers/recurring-rule.controller.js';
import { createRecurringRuleSchema, updateRecurringRuleSchema } from '../validators/recurring-rule.validator.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createRecurringRuleSchema), RecurringRuleController.create);
router.get('/', RecurringRuleController.getAll);
router.get('/:id', RecurringRuleController.getById);
router.put('/:id', validate(updateRecurringRuleSchema), RecurringRuleController.update);
router.delete('/:id', RecurringRuleController.delete);
router.post('/:id/execute', RecurringRuleController.execute);

export default router;
