/**
 * Analytics Controller
 * --------------------
 * Provides dashboard KPIs, study insights, and CSV export.
 */

import { Request, Response } from 'express';
import { stringify } from 'csv-stringify/sync';
import prisma from '../db';
import { getInsights } from '../services/insights.service';
import { config } from '../config';

// ── GET /api/analytics/dashboard ──────────────────────────────────────────

export async function getDashboard(req: Request, res: Response) {
  const [
    totalStudents,
    totalClasses,
    recentAttendance,
    gradeStats,
    atRiskCount,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.class.count(),
    // Attendance stats for last 30 days
    prisma.attendance.groupBy({
      by: ['status'],
      where: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      _count: { status: true },
    }),
    // Average grade across all students
    prisma.grade.aggregate({ _avg: { score: true }, _count: { id: true } }),
    // Count students below attendance threshold
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT s.id)::bigint as count
      FROM students s
      JOIN attendance a ON a.student_id = s.id
      WHERE a.date >= NOW() - INTERVAL '30 days'
      GROUP BY s.id
      HAVING (COUNT(CASE WHEN a.status IN ('PRESENT','LATE') THEN 1 END)::float / COUNT(*)) * 100 < ${config.attendanceThreshold}
    `,
  ]);

  // Build attendance summary
  const attendanceSummary = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
  for (const r of recentAttendance) {
    attendanceSummary[r.status as keyof typeof attendanceSummary] = r._count.status;
  }
  const total = Object.values(attendanceSummary).reduce((s, x) => s + x, 0);
  const avgAttendancePct = total > 0
    ? Math.round(((attendanceSummary.PRESENT + attendanceSummary.LATE) / total) * 100)
    : 0;

  return res.json({
    success: true,
    data: {
      kpis: {
        totalStudents,
        totalClasses,
        avgAttendancePct,
        avgGradeScore: Math.round(gradeStats._avg.score || 0),
        atRiskStudents: Number(atRiskCount[0]?.count || 0),
      },
      attendanceSummary,
    },
  });
}

// ── GET /api/analytics/insights ────────────────────────────────────────────

export async function getStudyInsights(req: Request, res: Response) {
  // Students see only their own insights
  let studentId: string | undefined;
  if (req.user?.role === 'STUDENT') {
    const myStudent = await prisma.student.findFirst({
      where: { userId: req.user.userId },
    });
    studentId = myStudent?.id;
  } else {
    studentId = req.query.studentId as string | undefined;
  }

  const insights = await getInsights(studentId);

  return res.json({ success: true, data: { insights } });
}

// ── GET /api/analytics/insights/export ─────────────────────────────────────

export async function exportInsightsCSV(req: Request, res: Response) {
  const insights = await getInsights();

  const rows = insights.map((i) => ({
    'Student ID': i.studentId,
    'Name': i.name,
    'Attendance %': i.attendancePercent,
    'Risk Flags': i.riskFlags.join('; '),
    'Strong Subjects': i.strongSubjects.join(', '),
    'Weak Subjects': i.weakSubjects.join(', '),
    'Suggestions': i.studySuggestions.join(' | '),
  }));

  const csv = stringify(rows, { header: true });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="student_insights.csv"');
  return res.send(csv);
}

// ── GET /api/analytics/grade-trends ───────────────────────────────────────

export async function getGradeTrends(req: Request, res: Response) {
  const { classId, subject } = req.query;

  const where: any = {};
  if (subject) where.subject = subject;
  if (classId) {
    where.student = { classId };
  }

  const grades = await prisma.grade.groupBy({
    by: ['term', 'subject'],
    where,
    _avg: { score: true },
    orderBy: [{ term: 'asc' }, { subject: 'asc' }],
  });

  return res.json({ success: true, data: { trends: grades } });
}
