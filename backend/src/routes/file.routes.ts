import { Router } from 'express';
import FileController from '../controllers/file.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { uploadMiddleware } from '../middlewares/upload.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

router.post('/', uploadMiddleware.single('file'), FileController.uploadFile);
router.get('/', FileController.getFiles);
router.get('/:id', FileController.getFileById);
router.put('/:id', FileController.updateFile);
router.delete('/:id', FileController.deleteFile);

export default router;
