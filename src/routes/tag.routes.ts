import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { TagController } from '../controllers/tag.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/', TagController.create);
router.get('/', TagController.getAll);
router.get('/:id', TagController.getById);
router.put('/:id', TagController.update);
router.delete('/:id', TagController.delete);

export default router;
