import { Router } from 'express';
import EventController from '../controllers/event.controller';
import { redirectLimiter } from '../middlewares/rate-limiter';

const router = Router();

// Note: Link redirects are placed here but will be mounted on root level in main router
router.get('/l/:code', redirectLimiter, EventController.handleLinkRedirect);

// File viewer details and direct download tracking routes
router.get('/api/events/file-meta/:code', EventController.getFileMetadata);
router.post('/api/events/lead', EventController.submitLead);
router.post('/api/events/ping', EventController.recordPing);
router.get('/api/events/download/:code', redirectLimiter, EventController.handleFileDownload);

export default router;
