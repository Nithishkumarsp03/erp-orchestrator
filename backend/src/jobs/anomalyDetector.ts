/**
 * Attendance Anomaly Detector (Background Job)
 * --------------------------------------------
 * Runs on a cron schedule (every day at 08:00).
 * Scans all students' rolling attendance for the last 30 days.
 * Students below the threshold get a notification created.
 *
 * This is a simple rule-engine approach — no external dependencies needed.
 */

import cron from 'node-cron';
import prisma from '../db';
import { config } from '../config';
import logger from '../utils/logger';

/**
 * Check all students' attendance and create notification for those below threshold.
 * Called by cron and can also be triggered manually.
 */
export async function runAnomalyDetector() {
  logger.info('🔍 Running attendance anomaly detector...');

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Get all students with their recent attendance
  const students = await prisma.student.findMany({
    include: {
      user: { select: { id: true, name: true } },
      attendances: {
        where: { date: { gte: thirtyDaysAgo } },
        select: { status: true },
      },
    },
  });

  let flaggedCount = 0;
  let notificationCount = 0;

  for (const student of students) {
    const total = student.attendances.length;
    if (total === 0) continue; // No data yet

    const present = student.attendances.filter(
      (a) => a.status === 'PRESENT' || a.status === 'LATE'
    ).length;

    const pct = Math.round((present / total) * 100);

    if (pct < config.attendanceThreshold) {
      flaggedCount++;

      // Check if we already sent a notification today for this student
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const existingNotif = await prisma.notification.findFirst({
        where: {
          userId: student.userId,
          type: 'ANOMALY',
          createdAt: { gte: todayStart },
        },
      });

      if (!existingNotif) {
        await prisma.notification.create({
          data: {
            userId: student.userId,
            title: '⚠️ Low Attendance Alert',
            message: `Your attendance for the last 30 days is ${pct}%, which is below the required ${config.attendanceThreshold}%. Please make arrangements to attend classes regularly.`,
            type: 'ANOMALY',
            read: false,
          },
        });
        notificationCount++;
      }
    }
  }

  logger.info(`✅ Anomaly detector complete: ${flaggedCount} flagged, ${notificationCount} new notifications sent`);
}

/**
 * Reminder job: sends notifications about upcoming test reminders.
 * In a real system this would query a "test schedule" table.
 * Here we simulate it with a fixed message.
 */
async function runReminderJob() {
  logger.info('🔔 Running reminder job...');

  // In production: query DB for upcoming tests in next 3 days
  // For demo: just log that the job ran
  logger.info('📅 Reminder job: No upcoming tests in the next 3 days (demo mode)');
}

/**
 * Register all cron jobs.
 * Called once at app startup.
 */
export function startJobs() {
  // Anomaly detector: every day at 08:00
  cron.schedule('0 8 * * *', () => {
    runAnomalyDetector().catch((err) =>
      logger.error('Anomaly detector failed', { error: err.message })
    );
  });

  // Reminder job: every day at 07:30
  cron.schedule('30 7 * * *', () => {
    runReminderJob().catch((err) =>
      logger.error('Reminder job failed', { error: err.message })
    );
  });

  logger.info('✅ Cron jobs scheduled: anomaly detector (daily 08:00), reminders (daily 07:30)');
}
