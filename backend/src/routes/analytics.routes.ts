import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getDashboard, getStudyInsights, exportInsightsCSV, getGradeTrends } from '../controllers/analytics.controller';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboard);
router.get('/insights', getStudyInsights);
router.get('/insights/export', authorize('ADMIN', 'TEACHER'), exportInsightsCSV);
router.get('/grade-trends', authorize('ADMIN', 'TEACHER'), getGradeTrends);

export default router;
