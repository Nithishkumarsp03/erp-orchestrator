import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { listNotes, createNote, updateNote, deleteNote } from '../controllers/notes.controller';

const router = Router();

router.use(authenticate);

router.get('/', listNotes);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;
