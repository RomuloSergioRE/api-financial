import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { exportLimiter } from '../middlewares/export-limiter.js';
import { TransactionController } from '../controllers/transactions.controller.js';
import { createTransactionSchema, updateTransactionSchema, transactionQuerySchema } from '../validators/transaction.validator.js';
import { linkTagsSchema } from '../validators/tag.validator.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authMiddleware);

router.post('/', validate(createTransactionSchema), TransactionController.create);
router.get('/', validate(transactionQuerySchema, 'query'), TransactionController.getAll);
router.get('/export/csv', exportLimiter, TransactionController.exportCSV);
router.get('/export/pdf', exportLimiter, TransactionController.exportPDF);
router.get('/export/template', TransactionController.exportTemplate);
router.post('/import/csv', upload.single('file'), TransactionController.importCSV);
router.post('/:id/tags', validate(linkTagsSchema), TransactionController.addTags);
router.delete('/:id/tags/:tagId', TransactionController.removeTag);
router.get('/:id', TransactionController.getById);
router.put('/:id', validate(updateTransactionSchema), TransactionController.update);
router.delete('/:id', TransactionController.delete);

export default router;
