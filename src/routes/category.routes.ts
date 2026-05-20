import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { CategoryController } from '../controllers/category.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/', CategoryController.create);
router.get('/', CategoryController.getAll);
router.get('/:id', CategoryController.getById);
router.put('/:id', CategoryController.update);
router.delete('/:id', CategoryController.delete);

export default router;