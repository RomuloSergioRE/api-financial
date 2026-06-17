import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requirePlan } from '../middlewares/plan.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { TagController } from '../controllers/tag.controller.js';
import { createTagSchema, updateTagSchema } from '../validators/tag.validator.js';

const router = Router();

router.use(authMiddleware);

router.post('/', requirePlan('pro'), validate(createTagSchema), TagController.create);
router.get('/', TagController.getAll);
router.get('/:id', TagController.getById);
router.put('/:id', requirePlan('pro'), validate(updateTagSchema), TagController.update);
router.delete('/:id', requirePlan('pro'), TagController.delete);

export default router;
