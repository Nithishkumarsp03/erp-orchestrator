/**
 * Audit Logs Controller (admin only)
 */

import { Request, Response } from 'express';
import prisma from '../db';

export async function getAuditLogs(req: Request, res: Response) {
  const page = parseInt(req.query.page as string || '1');
  const limit = Math.min(parseInt(req.query.limit as string || '50'), 200);
  const skip = (page - 1) * limit;

  const where: any = {};
  if (req.query.action) where.action = req.query.action;
  if (req.query.resource) where.resource = req.query.resource;
  if (req.query.userId) where.userId = req.query.userId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true, role: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return res.json({
    success: true,
    data: {
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  });
}
