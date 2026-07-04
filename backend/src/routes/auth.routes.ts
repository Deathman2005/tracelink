import { Router } from 'express';
import AuthController from '../controllers/auth.controller';
import { authLimiter } from '../middlewares/rate-limiter';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.post('/signup', authLimiter, AuthController.signup);
router.post('/login', authLimiter, AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/me', authenticateJWT, AuthController.me);
router.put('/settings', authenticateJWT, AuthController.updateUserSettings);

export default router;
