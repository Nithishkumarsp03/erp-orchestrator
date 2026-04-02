/**
 * Custom API Error Class
 * ----------------------
 * Centralises error creation so every thrown error has:
 *  - HTTP status code
 *  - Machine-readable code (e.g. "UNAUTHORIZED", "VALIDATION_ERROR")
 *  - Human-readable message
 *  - Optional field-level validation errors
 *
 * The global error handler picks these up and formats the response.
 */

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly errors?: Record<string, string>[]
  ) {
    super(message);
    this.name = 'AppError';
    // Maintain proper prototype chain in TypeScript
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ── Convenience factories ──────────────────────────────────────────────────

export const badRequest = (msg: string, errors?: Record<string, string>[]) =>
  new AppError(400, 'BAD_REQUEST', msg, errors);

export const unauthorized = (msg = 'Unauthorized') =>
  new AppError(401, 'UNAUTHORIZED', msg);

export const forbidden = (msg = 'Forbidden') =>
  new AppError(403, 'FORBIDDEN', msg);

export const notFound = (resource = 'Resource') =>
  new AppError(404, 'NOT_FOUND', `${resource} not found`);

export const conflict = (msg: string) =>
  new AppError(409, 'CONFLICT', msg);

export const tooManyRequests = (msg = 'Too many requests') =>
  new AppError(429, 'RATE_LIMITED', msg);

export const internalError = (msg = 'Internal server error') =>
  new AppError(500, 'INTERNAL_ERROR', msg);
