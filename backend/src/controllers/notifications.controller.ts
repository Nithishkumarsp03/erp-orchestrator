/**
 * Notifications Controller
 */

import { Request, Response } from 'express';
import prisma from '../db';

export async function getNotifications(req: Request, res: Response) {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: req.user!.userId, read: false },
  });

  return res.json({ success: true, data: { notifications, unreadCount } });
}

export async function markRead(req: Request, res: Response) {
  const { id } = req.params;

  await prisma.notification.updateMany({
    where: { id, userId: req.user!.userId },
    data: { read: true },
  });

  return res.json({ success: true, message: 'Notification marked as read' });
}

export async function markAllRead(req: Request, res: Response) {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, read: false },
    data: { read: true },
  });

  return res.json({ success: true, message: 'All notifications marked as read' });
}
