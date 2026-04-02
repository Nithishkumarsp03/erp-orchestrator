import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getAuditLogs } from '../controllers/audit.controller';

const router = Router();

router.get('/', authenticate, authorize('ADMIN'), getAuditLogs);

export default router;
