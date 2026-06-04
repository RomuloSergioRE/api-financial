import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { TagController } from '../controllers/tag.controller.js';
import { createTagSchema, updateTagSchema } from '../validators/tag.validator.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createTagSchema), TagController.create);
router.get('/', TagController.getAll);
router.get('/:id', TagController.getById);
router.put('/:id', validate(updateTagSchema), TagController.update);
router.delete('/:id', TagController.delete);

export default router;
