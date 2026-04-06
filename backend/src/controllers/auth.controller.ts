/**
 * Auth Controller
 * ---------------
 * Handles user registration, login, token refresh, and logout.
 *
 * Security measures:
 *  - bcrypt hashing (12 salt rounds)
 *  - Refresh tokens stored in httpOnly cookie + DB (for revocation)
 *  - Account lockout after 5 failed login attempts (15 min cooldown)
 *  - Tokens rotated on each refresh
 *  - Tokens invalidated on logout
 */

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { unauthorized, conflict } from '../utils/errors';
import { auditLog } from '../utils/auditLog';
import { registerSchema, loginSchema } from '../utils/schemas';
import { config } from '../config';
import logger from '../utils/logger';

// Refresh token cookie name
const REFRESH_COOKIE = 'refreshToken';

/** Set the refresh token as a secure httpOnly cookie */
function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/api/auth',
  });
}

// ── POST /api/auth/register ─────────────────────────────────────────────────

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);

  // Check for duplicate email
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw conflict('Email already registered');

  // Hash password with bcrypt (12 rounds meets OWASP recommendation)
  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, passwordHash, role: data.role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  await auditLog(req, 'REGISTER', 'users', { userId: user.id, email: user.email });

  logger.info('User registered', { userId: user.id, role: user.role });

  return res.status(201).json({ success: true, data: { user } });
}

// ── POST /api/auth/login ────────────────────────────────────────────────────

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });

  // Account lockout check
  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    const remaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    throw unauthorized(`Account locked. Try again in ${remaining} minutes.`);
  }

  // Constant-time comparison (bcrypt handles this, but we also guard user existence)
  const passwordValid = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !passwordValid) {
    // Increment failed attempts and potentially lock account
    if (user) {
      const attempts = user.failedAttempts + 1;
      const locked = attempts >= 5;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: attempts,
          lockedUntil: locked ? new Date(Date.now() + 15 * 60 * 1000) : undefined,
        },
      });
      logger.warn('Failed login attempt', { email, attempts, locked });
    }

    throw unauthorized('Invalid email or password');
  }

  // Reset failed attempts on successful login
  if (user.failedAttempts > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null },
    });
  }

  // Build token payload
  const payload = { userId: user.id, role: user.role, email: user.email };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Store refresh token in DB for revocation support
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { userId: user.id, token: refreshToken, expiresAt },
  });

  setRefreshCookie(res, refreshToken);
  await auditLog(req, 'LOGIN', 'users', { userId: user.id });

  logger.info('User logged in', { userId: user.id });

  return res.json({
    success: true,
    data: {
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    },
  });
}

// ── POST /api/auth/refresh ──────────────────────────────────────────────────

export async function refreshTokens(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];

  if (!token) throw unauthorized('No refresh token provided');

  // Verify token signature
  let payload: ReturnType<typeof verifyRefreshToken>;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw unauthorized('Invalid or expired refresh token');
  }

  // Check token exists in DB (supports revocation)
  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    // Clean up if expired
    if (stored) await prisma.refreshToken.delete({ where: { token } });
    throw unauthorized('Refresh token revoked or expired');
  }

  // Rotate tokens (delete old, create new)
  await prisma.refreshToken.delete({ where: { token } });

  const newPayload = { userId: payload.userId, role: payload.role, email: payload.email };
  const accessToken = signAccessToken(newPayload);
  const newRefreshToken = signRefreshToken(newPayload);

  await prisma.refreshToken.create({
    data: {
      userId: payload.userId,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  setRefreshCookie(res, newRefreshToken);

  return res.json({ success: true, data: { accessToken } });
}

// ── POST /api/auth/logout ───────────────────────────────────────────────────

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];

  // Delete from DB if present
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } }).catch(() => {});
  }

  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  await auditLog(req, 'LOGOUT', 'users', { userId: req.user?.userId });

  return res.json({ success: true, message: 'Logged out successfully' });
}

// ── GET /api/auth/me ─────────────────────────────────────────────────────────

export async function getMe(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true, name: true, email: true, role: true, createdAt: true,
      student: { select: { id: true, admissionNo: true, classId: true } },
    },
  });

  if (!user) throw unauthorized('User not found');

  return res.json({ success: true, data: { user } });
}
