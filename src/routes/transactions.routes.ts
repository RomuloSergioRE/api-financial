import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { TransactionController } from '../controllers/transactions.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

router.post('/', TransactionController.create);
router.get('/', TransactionController.getAll);
router.get('/export/csv', TransactionController.exportCSV);
router.get('/export/pdf', TransactionController.exportPDF);
router.get('/export/template', TransactionController.exportTemplate);
router.post('/import/csv', upload.single('file'), TransactionController.importCSV);
router.post('/:id/tags', TransactionController.addTags);
router.delete('/:id/tags/:tagId', TransactionController.removeTag);
router.get('/:id', TransactionController.getById);
router.put('/:id', TransactionController.update);
router.delete('/:id', TransactionController.delete);

export default router;
