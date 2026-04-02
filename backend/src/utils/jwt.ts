/**
 * JWT Utilities
 * -------------
 * Functions for signing and verifying access & refresh tokens.
 *
 * Security design:
 *  - Access tokens: short-lived (15 min), stored in JS memory (not localStorage)
 *  - Refresh tokens: long-lived (7 days), stored in httpOnly Secure cookie
 *  - Refresh tokens are rotated on every use and stored in the DB for revocation
 */

import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface TokenPayload {
  userId: string;
  role: string;
  email: string;
}

/**
 * Sign a short-lived access token (15 min default).
 */
export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn as any,
    issuer: 'student-dashboard',
    audience: 'student-dashboard-client',
  });
}

/**
 * Sign a long-lived refresh token (7 days default).
 */
export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as any,
    issuer: 'student-dashboard',
    audience: 'student-dashboard-client',
  });
}

/**
 * Verify and decode an access token.
 * Throws jwt.JsonWebTokenError or jwt.TokenExpiredError on failure.
 */
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.accessSecret, {
    issuer: 'student-dashboard',
    audience: 'student-dashboard-client',
  }) as TokenPayload;
}

/**
 * Verify and decode a refresh token.
 */
export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.refreshSecret, {
    issuer: 'student-dashboard',
    audience: 'student-dashboard-client',
  }) as TokenPayload;
}
