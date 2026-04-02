import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  listStudents,
  createStudent,
  getStudent,
  updateStudent,
  deleteStudent,
  getStudentsByPrompt,
} from '../controllers/students.controller';
import { generateStudentReport } from '../controllers/report.controller';

const router = Router();

// All student routes require authentication
router.use(authenticate);

router.get('/', listStudents);
router.post('/', authorize('ADMIN', 'TEACHER'), createStudent);
router.post('/prompt', authorize('ADMIN'), getStudentsByPrompt);
router.get('/:id', getStudent);
router.put('/:id', authorize('ADMIN', 'TEACHER'), updateStudent);
router.delete('/:id', authorize('ADMIN'), deleteStudent);

// PDF report
router.get('/:id/report', generateStudentReport);

export default router;
