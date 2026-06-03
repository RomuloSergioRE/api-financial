import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { CategoryController } from '../controllers/category.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

router.post('/', CategoryController.create);
router.get('/', CategoryController.getAll);
router.get('/export/csv', CategoryController.exportCSV);
router.get('/export/pdf', CategoryController.exportPDF);
router.post('/import/csv', upload.single('file'), CategoryController.importCSV);
router.get('/:id', CategoryController.getById);
router.put('/:id', CategoryController.update);
router.delete('/:id', CategoryController.delete);

export default router;