import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { TransactionController } from '../controllers/transactions.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/', TransactionController.create);
router.get('/', TransactionController.getAll);
router.get('/:id', TransactionController.getById);
router.put('/:id', TransactionController.update);
router.delete('/:id', TransactionController.delete);

export default router;