import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { recordAttendance, getAttendance, getStudentAttendanceSummary } from '../controllers/attendance.controller';

const router = Router();

router.use(authenticate);

router.post('/', authorize('ADMIN', 'TEACHER'), recordAttendance);
router.get('/', getAttendance);
router.get('/student/:studentId/summary', getStudentAttendanceSummary);

export default router;
