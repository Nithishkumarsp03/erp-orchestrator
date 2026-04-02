/**
 * Notes Controller
 */

import { Request, Response } from 'express';
import prisma from '../db';
import { notFound, forbidden } from '../utils/errors';
import { createNoteSchema, updateNoteSchema } from '../utils/schemas';
import { auditLog } from '../utils/auditLog';

export async function listNotes(req: Request, res: Response) {
  const { studentId } = req.query;
  const where: any = {};
  if (studentId) where.studentId = studentId;

  // Students only see PUBLIC notes
  if (req.user?.role === 'STUDENT') {
    where.visibility = 'PUBLIC';
  }

  const notes = await prisma.note.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { name: true, role: true } },
      student: { include: { user: { select: { name: true } } } },
    },
  });

  return res.json({ success: true, data: { notes } });
}

export async function createNote(req: Request, res: Response) {
  const data = createNoteSchema.parse(req.body);

  const note = await prisma.note.create({
    data: { ...data, authorId: req.user!.userId },
    include: { author: { select: { name: true, role: true } } },
  });

  await auditLog(req, 'CREATE_NOTE', 'notes', { noteId: note.id, studentId: data.studentId });

  return res.status(201).json({ success: true, data: { note } });
}

export async function updateNote(req: Request, res: Response) {
  const { id } = req.params;
  const data = updateNoteSchema.parse(req.body);

  const existing = await prisma.note.findUnique({ where: { id } });
  if (!existing) throw notFound('Note');

  // Only the author or admin can edit
  if (existing.authorId !== req.user!.userId && req.user?.role !== 'ADMIN') {
    throw forbidden('You can only edit your own notes');
  }

  const note = await prisma.note.update({ where: { id }, data });

  return res.json({ success: true, data: { note } });
}

export async function deleteNote(req: Request, res: Response) {
  const { id } = req.params;

  const existing = await prisma.note.findUnique({ where: { id } });
  if (!existing) throw notFound('Note');

  if (existing.authorId !== req.user!.userId && req.user?.role !== 'ADMIN') {
    throw forbidden('You can only delete your own notes');
  }

  await prisma.note.delete({ where: { id } });
  await auditLog(req, 'DELETE_NOTE', 'notes', { noteId: id });

  return res.json({ success: true, message: 'Note deleted' });
}
