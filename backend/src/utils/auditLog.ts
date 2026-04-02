/**
 * Audit Log Middleware  
 * --------------------
 * Records critical actions (create, update, delete) to the audit_logs table.
 * Call this utility function in controllers for sensitive operations.
 *
 * Example:
 *   await auditLog(req, 'CREATE_STUDENT', 'students', { studentId: newStudent.id });
 */

import { Request } from 'express';
import prisma from '../db';
import logger from './logger';

export async function auditLog(
  req: Request,
  action: string,
  resource: string,
  details: Record<string, any> = {}
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action,
        resource,
        details,
        ip: req.ip || req.socket.remoteAddress || 'unknown',
      },
    });
  } catch (err) {
    // Never let audit logging crash the main request
    logger.error('Failed to write audit log', { action, resource, error: err });
  }
}
