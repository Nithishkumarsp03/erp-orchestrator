import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getNotifications, markRead, markAllRead } from '../controllers/notifications.controller';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.put('/:id/read', markRead);
router.put('/read-all', markAllRead);

export default router;
