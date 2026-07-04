import { Router } from 'express';
import authRoutes from './auth.routes';
import linkRoutes from './link.routes';
import fileRoutes from './file.routes';
import eventRoutes from './event.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

router.use('/api/auth', authRoutes);
router.use('/api/links', linkRoutes);
router.use('/api/files', fileRoutes);
router.use('/api/analytics', analyticsRoutes);

// Mounts tracking event routes including root redirections like /l/:code
router.use('/', eventRoutes);

export default router;
