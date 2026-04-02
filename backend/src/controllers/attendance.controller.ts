/**
 * Attendance Controller
 * ---------------------
 * Bulk record attendance, query history with anomaly flags,
 * and retrieve per-student attendance summaries.
 */

import { Request, Response } from 'express';
import prisma from '../db';
import { recordAttendanceSchema, attendanceQuerySchema } from '../utils/schemas';
import { auditLog } from '../utils/auditLog';
import { config } from '../config';

// ── POST /api/attendance ───────────────────────────────────────────────────

export async function recordAttendance(req: Request, res: Response) {
  const { records } = recordAttendanceSchema.parse(req.body);

  // Upsert in a transaction — same student+class+date combo updates instead of error
  const results = await prisma.$transaction(
    records.map((r) =>
      prisma.attendance.upsert({
        where: {
          studentId_classId_date: {
            studentId: r.studentId,
            classId: r.classId,
            date: new Date(r.date),
          },
        },
        create: {
          studentId: r.studentId,
          classId: r.classId,
          date: new Date(r.date),
          status: r.status,
          recordedBy: req.user!.userId,
        },
        update: {
          status: r.status,
          recordedBy: req.user!.userId,
        },
      })
    )
  );

  await auditLog(req, 'RECORD_ATTENDANCE', 'attendance', {
    count: results.length,
    date: records[0]?.date,
  });

  return res.status(201).json({
    success: true,
    data: { recorded: results.length, records: results },
  });
}

// ── GET /api/attendance ────────────────────────────────────────────────────

export async function getAttendance(req: Request, res: Response) {
  const query = attendanceQuerySchema.parse(req.query);

  // Students can only view their own attendance
  let studentId = query.studentId;
  if (req.user?.role === 'STUDENT') {
    const myStudent = await prisma.student.findFirst({
      where: { userId: req.user.userId },
    });
    studentId = myStudent?.id;
  }

  const where: any = {};
  if (studentId) where.studentId = studentId;
  if (query.classId) where.classId = query.classId;
  if (query.status) where.status = query.status;
  if (query.from || query.to) {
    where.date = {};
    if (query.from) where.date.gte = new Date(query.from);
    if (query.to) where.date.lte = new Date(query.to);
  }

  const records = await prisma.attendance.findMany({
    where,
    orderBy: { date: 'desc' },
    include: {
      student: { include: { user: { select: { name: true } } } },
      class: { select: { name: true } },
    },
    take: 500, // safety cap
  });

  // Compute per-student attendance percentages and flag anomalies
  const studentMap = new Map<string, { present: number; total: number; name: string }>();

  for (const r of records) {
    const entry = studentMap.get(r.studentId) || {
      present: 0,
      total: 0,
      name: r.student.user.name,
    };
    entry.total++;
    if (r.status === 'PRESENT' || r.status === 'LATE') entry.present++;
    studentMap.set(r.studentId, entry);
  }

  const anomalies = Array.from(studentMap.entries())
    .map(([studentId, s]) => ({
      studentId,
      name: s.name,
      attendancePercent: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
      flagged: s.total > 0 && (s.present / s.total) * 100 < config.attendanceThreshold,
    }))
    .filter((a) => a.flagged);

  return res.json({
    success: true,
    data: {
      records,
      anomalies,
      summary: {
        total: records.length,
        present: records.filter((r) => r.status === 'PRESENT').length,
        absent: records.filter((r) => r.status === 'ABSENT').length,
        late: records.filter((r) => r.status === 'LATE').length,
        excused: records.filter((r) => r.status === 'EXCUSED').length,
      },
    },
  });
}

// ── GET /api/attendance/student/:studentId/summary ─────────────────────────

export async function getStudentAttendanceSummary(req: Request, res: Response) {
  const { studentId } = req.params;

  const records = await prisma.attendance.findMany({
    where: { studentId },
    orderBy: { date: 'asc' },
  });

  const total = records.length;
  const present = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const attendancePercent = total > 0 ? Math.round((present / total) * 100) : 0;

  // Build heatmap data: { date: 'YYYY-MM-DD', status: string }[]
  const heatmap = records.map((r) => ({
    date: r.date.toISOString().split('T')[0],
    status: r.status,
  }));

  return res.json({
    success: true,
    data: {
      total,
      present,
      absent: records.filter((r) => r.status === 'ABSENT').length,
      late: records.filter((r) => r.status === 'LATE').length,
      excused: records.filter((r) => r.status === 'EXCUSED').length,
      attendancePercent,
      flagged: attendancePercent < config.attendanceThreshold,
      heatmap,
    },
  });
}
