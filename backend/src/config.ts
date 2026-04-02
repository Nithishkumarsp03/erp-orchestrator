/**
 * Environment configuration loader
 * ---------------------------------
 * Validates that all required environment variables are present at startup.
 * Throws an error immediately if any required variable is missing,
 * preventing the app from starting with broken configuration.
 */

import dotenv from 'dotenv';
dotenv.config();

// Helper: read env var or throw
function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export const config = {
  // Server
  port: parseInt(optional('PORT', '5000'), 10),
  nodeEnv: optional('NODE_ENV', 'development'),
  isProduction: optional('NODE_ENV', 'development') === 'production',

  // Database
  databaseUrl: required('DATABASE_URL'),

  // JWT
  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiresIn: optional('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  // CORS
  corsOrigins: optional('CORS_ORIGINS', 'http://localhost:5173').split(',').map(s => s.trim()),

  // Redis
  redisUrl: optional('REDIS_URL', 'redis://localhost:6379'),

  // Cookies
  cookie: {
    secure: optional('COOKIE_SECURE', 'false') === 'true',
    sameSite: optional('COOKIE_SAME_SITE', 'lax') as 'strict' | 'lax' | 'none',
  },

  // Attendance
  attendanceThreshold: parseInt(optional('ATTENDANCE_THRESHOLD', '75'), 10),

  // Logging
  logLevel: optional('LOG_LEVEL', 'info'),

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(optional('RATE_LIMIT_WINDOW_MS', '60000'), 10),
    max: parseInt(optional('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
  },
};
