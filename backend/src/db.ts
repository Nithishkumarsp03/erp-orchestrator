/**
 * Prisma Database Client
 * ----------------------
 * Singleton instance of the Prisma client.
 * Using a singleton prevents creating multiple connections in development
 * (Next.js/Vite HMR can re-import modules, causing connection pool exhaustion).
 */

import { PrismaClient } from '@prisma/client';
import logger from './utils/logger';

// Prevent multiple Prisma Client instances in development/test
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

// Log slow queries in development
if (process.env.NODE_ENV !== 'production') {
  (prisma as any).$on('query', (e: { query: string; duration: number }) => {
    if (e.duration > 200) {
      logger.warn('Slow DB query detected', { query: e.query, duration: `${e.duration}ms` });
    }
  });
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
