/**
 * Authentication Middleware
 * -------------------------
 * Verifies the JWT access token from the Authorization header.
 * On success, attaches decoded user info to req.user.
 * On failure, returns 401 Unauthorized.
 *
 * Usage: router.get('/protected', authenticate, handler)
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { unauthorized } from '../utils/errors';
import logger from '../utils/logger';

// Extend Express Request type to carry user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        email: string;
      };
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(unauthorized('No access token provided'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      role: payload.role,
      email: payload.email,
    };
    next();
  } catch (err: any) {
    logger.debug('Token verification failed', { error: err.message });
    if (err.name === 'TokenExpiredError') {
      return next(unauthorized('Access token expired'));
    }
    return next(unauthorized('Invalid access token'));
  }
}

/**
 * Role-based access control middleware factory.
 * Pass the roles that are allowed to access the route.
 *
 * Usage: router.get('/admin', authenticate, authorize('ADMIN'), handler)
 */
export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(unauthorized());
    }

    if (!roles.includes(req.user.role)) {
      return next({
        statusCode: 403,
        code: 'FORBIDDEN',
        message: `Access denied. Required role(s): ${roles.join(', ')}`,
      });
    }

    next();
  };
}
