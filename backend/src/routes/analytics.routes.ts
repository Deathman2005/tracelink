import { Router } from 'express';
import AnalyticsController from '../controllers/analytics.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

// All analytics routes require authentication
router.use(authenticateJWT);

router.get('/dashboard-kpis', AnalyticsController.getDashboardKPIs);
router.get('/charts', AnalyticsController.getTrafficCharts);
router.get('/visitor-sources', AnalyticsController.getVisitorDistribution);
router.get('/leads', AnalyticsController.getLeads);
router.get('/scores', AnalyticsController.getScores);
router.get('/recent-events', AnalyticsController.getRecentEvents);
router.get('/notifications', AnalyticsController.getNotifications);
router.put('/notifications/read', AnalyticsController.markNotificationsRead);

export default router;
