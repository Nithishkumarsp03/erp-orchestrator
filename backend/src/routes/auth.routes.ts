import { Router } from 'express';
import { register, login, refreshTokens, logout, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

/** POST /api/auth/register */
router.post('/register', register);

/** POST /api/auth/login */
router.post('/login', login);

/** POST /api/auth/refresh — reads httpOnly cookie */
router.post('/refresh', refreshTokens);

/** POST /api/auth/logout */
router.post('/logout', logout);

/** GET /api/auth/me — requires auth */
router.get('/me', authenticate, getMe);

export default router;
