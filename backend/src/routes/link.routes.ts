import { Router } from 'express';
import LinkController from '../controllers/link.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

router.post('/', LinkController.createLink);
router.get('/', LinkController.getLinks);
router.get('/:id', LinkController.getLinkById);
router.put('/:id', LinkController.updateLink);
router.delete('/:id', LinkController.deleteLink);

export default router;
