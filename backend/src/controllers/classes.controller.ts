/**
 * Classes Controller
 * ------------------
 * CRUD for classes, with teacher assignment.
 */

import { Request, Response } from 'express';
import prisma from '../db';
import { notFound } from '../utils/errors';
import { auditLog } from '../utils/auditLog';
import { createClassSchema, updateClassSchema } from '../utils/schemas';

export async function listClasses(req: Request, res: Response) {
  const classes = await prisma.class.findMany({
    include: {
      teacher: { select: { id: true, name: true, email: true } },
      _count: { select: { students: true, attendances: true } },
    },
    orderBy: { name: 'asc' },
  });

  return res.json({ success: true, data: { classes } });
}

export async function createClass(req: Request, res: Response) {
  const data = createClassSchema.parse(req.body);

  const cls = await prisma.class.create({
    data,
    include: { teacher: { select: { id: true, name: true } } },
  });

  await auditLog(req, 'CREATE_CLASS', 'classes', { classId: cls.id });

  return res.status(201).json({ success: true, data: { class: cls } });
}

export async function getClass(req: Request, res: Response) {
  const { id } = req.params;

  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      teacher: { select: { id: true, name: true, email: true } },
      students: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { user: { name: 'asc' } },
      },
    },
  });

  if (!cls) throw notFound('Class');

  return res.json({ success: true, data: { class: cls } });
}

export async function updateClass(req: Request, res: Response) {
  const { id } = req.params;
  const data = updateClassSchema.parse(req.body);

  const existing = await prisma.class.findUnique({ where: { id } });
  if (!existing) throw notFound('Class');

  const cls = await prisma.class.update({
    where: { id },
    data,
    include: { teacher: { select: { id: true, name: true } } },
  });

  await auditLog(req, 'UPDATE_CLASS', 'classes', { classId: id });

  return res.json({ success: true, data: { class: cls } });
}

export async function deleteClass(req: Request, res: Response) {
  const { id } = req.params;

  const existing = await prisma.class.findUnique({ where: { id } });
  if (!existing) throw notFound('Class');

  await prisma.class.delete({ where: { id } });
  await auditLog(req, 'DELETE_CLASS', 'classes', { classId: id });

  return res.json({ success: true, message: 'Class deleted successfully' });
}
