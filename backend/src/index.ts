/**
 * Server Entry Point
 * ------------------
 * Starts the Express server and background jobs.
 * Handles graceful shutdown on SIGTERM/SIGINT.
 */

import app from './app';
import { config } from './config';
import logger from './utils/logger';
import { startJobs } from './jobs/anomalyDetector';
import prisma from './db';

const server = app.listen(config.port, () => {
  logger.info(`🚀 Server running on port ${config.port} [${config.nodeEnv}]`);
  logger.info(`📊 API available at http://localhost:${config.port}/api`);
  logger.info(`❤️  Health check: http://localhost:${config.port}/api/health`);

  // Start background cron jobs
  startJobs();
});

// Graceful shutdown — allows in-flight requests to complete
async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received — shutting down gracefully...`);

  server.close(async () => {
    logger.info('HTTP server closed');
    await prisma.$disconnect();
    logger.info('Database disconnected');
    process.exit(0);
  });

  // Force exit after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason });
});

export default server;
