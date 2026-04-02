import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { listGrades, createGrade, updateGrade, deleteGrade } from '../controllers/grades.controller';

const router = Router();

router.use(authenticate);

router.get('/', listGrades);
router.post('/', authorize('ADMIN', 'TEACHER'), createGrade);
router.put('/:id', authorize('ADMIN', 'TEACHER'), updateGrade);
router.delete('/:id', authorize('ADMIN', 'TEACHER'), deleteGrade);

export default router;
