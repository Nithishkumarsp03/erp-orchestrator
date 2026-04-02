/**
 * Grades Controller
 */

import { Request, Response } from 'express';
import prisma from '../db';
import { notFound } from '../utils/errors';
import { createGradeSchema, updateGradeSchema } from '../utils/schemas';
import { auditLog } from '../utils/auditLog';

export async function listGrades(req: Request, res: Response) {
  const { studentId, subject, term } = req.query;
  const where: any = {};
  if (studentId) where.studentId = studentId;
  if (subject) where.subject = subject;
  if (term) where.term = term;

  const grades = await prisma.grade.findMany({
    where,
    orderBy: [{ term: 'asc' }, { subject: 'asc' }],
    include: { student: { include: { user: { select: { name: true } } } } },
  });

  return res.json({ success: true, data: { grades } });
}

export async function createGrade(req: Request, res: Response) {
  const data = createGradeSchema.parse(req.body);

  const grade = await prisma.grade.create({
    data,
    include: { student: { include: { user: { select: { name: true } } } } },
  });

  await auditLog(req, 'CREATE_GRADE', 'grades', { gradeId: grade.id });

  return res.status(201).json({ success: true, data: { grade } });
}

export async function updateGrade(req: Request, res: Response) {
  const { id } = req.params;
  const data = updateGradeSchema.parse(req.body);

  const existing = await prisma.grade.findUnique({ where: { id } });
  if (!existing) throw notFound('Grade');

  const grade = await prisma.grade.update({ where: { id }, data });

  await auditLog(req, 'UPDATE_GRADE', 'grades', { gradeId: id });

  return res.json({ success: true, data: { grade } });
}

export async function deleteGrade(req: Request, res: Response) {
  const { id } = req.params;
  const existing = await prisma.grade.findUnique({ where: { id } });
  if (!existing) throw notFound('Grade');

  await prisma.grade.delete({ where: { id } });
  await auditLog(req, 'DELETE_GRADE', 'grades', { gradeId: id });

  return res.json({ success: true, message: 'Grade deleted' });
}
