/**
 * Global Error Handler
 * --------------------
 * Catches all errors thrown via next(err) in route handlers.
 * Returns a consistent JSON error format:
 *
 * {
 *   "success": false,
 *   "code": "NOT_FOUND",
 *   "message": "Student not found",
 *   "errors": [...],   // optional: field-level validation errors
 *   "requestId": "..."
 * }
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

export function errorHandler(
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log the error with request context
  logger.error('Request error', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    error: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  // ── Handle Zod validation errors ──────────────────────────────────
  if (err instanceof ZodError) {
    const fieldErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Input validation failed',
      errors: fieldErrors,
    });
  }

  // ── Handle known AppErrors ────────────────────────────────────────
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  }

  // ── Handle Prisma errors ──────────────────────────────────────────
  const prismaError = err as any;
  if (prismaError.code === 'P2002') {
    return res.status(409).json({
      success: false,
      code: 'CONFLICT',
      message: 'A record with this value already exists',
    });
  }

  if (prismaError.code === 'P2025') {
    return res.status(404).json({
      success: false,
      code: 'NOT_FOUND',
      message: 'Record not found',
    });
  }

  // ── Fallback for unexpected errors ────────────────────────────────
  return res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    ...(process.env.NODE_ENV !== 'production' && { detail: err.message }),
  });
}

/**
 * 404 handler - catches requests to undefined routes.
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  });
}
