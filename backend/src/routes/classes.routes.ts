import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { listClasses, createClass, getClass, updateClass, deleteClass } from '../controllers/classes.controller';

const router = Router();

router.use(authenticate);

router.get('/', listClasses);
router.post('/', authorize('ADMIN', 'TEACHER'), createClass);
router.get('/:id', getClass);
router.put('/:id', authorize('ADMIN', 'TEACHER'), updateClass);
router.delete('/:id', authorize('ADMIN'), deleteClass);

export default router;
