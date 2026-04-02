/**
 * Insights Service
 * ----------------
 * Deterministic "smart" features — no external AI calls.
 * Uses heuristics on grade and attendance data to produce:
 *  1. Study suggestions for teachers/students
 *  2. Risk flags (low attendance, failing trends)
 *  3. A one-line auto-summary for each student profile
 */

import prisma from '../db';
import { config } from '../config';

// ── Types ──────────────────────────────────────────────────────────────────

interface SubjectStats {
  subject: string;
  avgScore: number;
  trend: 'improving' | 'declining' | 'stable';
  termScores: { term: string; score: number }[];
}

interface StudentInsight {
  studentId: string;
  name: string;
  attendancePercent: number;
  riskFlags: string[];
  studySuggestions: string[];
  subjectStats: SubjectStats[];
  strongSubjects: string[];
  weakSubjects: string[];
}

// ── Core computations ──────────────────────────────────────────────────────

/**
 * Compute per-subject stats and trend direction for a student.
 * Trend is determined by comparing first-half and second-half term averages.
 */
function computeSubjectStats(grades: { subject: string; score: number; maxScore: number; term: string }[]): SubjectStats[] {
  // Group by subject
  const bySubject = new Map<string, { term: string; pct: number }[]>();

  for (const g of grades) {
    const pct = Math.round((g.score / g.maxScore) * 100);
    const list = bySubject.get(g.subject) || [];
    list.push({ term: g.term, pct });
    bySubject.set(g.subject, list);
  }

  const stats: SubjectStats[] = [];

  for (const [subject, records] of bySubject.entries()) {
    const sorted = records.sort((a, b) => a.term.localeCompare(b.term));
    const scores = sorted.map((r) => r.pct);
    const avgScore = Math.round(scores.reduce((s, x) => s + x, 0) / scores.length);

    // Simple trend: compare first half vs second half
    let trend: SubjectStats['trend'] = 'stable';
    if (scores.length >= 2) {
      const mid = Math.floor(scores.length / 2);
      const firstHalf = scores.slice(0, mid).reduce((s, x) => s + x, 0) / mid;
      const secondHalf = scores.slice(mid).reduce((s, x) => s + x, 0) / (scores.length - mid);
      const diff = secondHalf - firstHalf;
      if (diff > 5) trend = 'improving';
      else if (diff < -5) trend = 'declining';
    }

    stats.push({
      subject,
      avgScore,
      trend,
      termScores: sorted.map((r) => ({ term: r.term, score: r.pct })),
    });
  }

  // Sort: weakest first
  return stats.sort((a, b) => a.avgScore - b.avgScore);
}

/**
 * Generate study suggestions based on heuristics.
 */
function buildSuggestions(
  attendancePercent: number,
  weakSubjects: string[],
  decliningSubjects: string[],
  strongSubjects: string[]
): string[] {
  const suggestions: string[] = [];

  if (attendancePercent < 60) {
    suggestions.push('⚠️ Critical: Attendance is below 60%. Immediate intervention required — please speak with the class counselor.');
  } else if (attendancePercent < 75) {
    suggestions.push(`📅 Attendance (${attendancePercent}%) is below the ${config.attendanceThreshold}% threshold. Aim to miss no more than 1 class per week.`);
  }

  if (weakSubjects.length > 0) {
    suggestions.push(`📚 Focus extra study time on: ${weakSubjects.slice(0, 3).join(', ')}. Consider seeking tutoring or forming a study group.`);
  }

  if (decliningSubjects.length > 0) {
    suggestions.push(`📉 Declining performance in: ${decliningSubjects.join(', ')}. Review recent test papers and identify knowledge gaps.`);
  }

  if (strongSubjects.length > 0) {
    suggestions.push(`🌟 Strong in: ${strongSubjects.slice(0, 2).join(', ')}. Consider helping classmates or joining advanced enrichment programs.`);
  }

  if (suggestions.length === 0) {
    suggestions.push('✅ Performance looks solid! Keep up the consistency and explore extra-curricular activities.');
  }

  return suggestions;
}

// ── Exported functions ─────────────────────────────────────────────────────

/**
 * Generate a one-line profile summary for a student.
 * Example: "Strong in Mathematics, needs attention in Biology; attendance 78%"
 */
export async function generateStudentSummary(student: any): Promise<string> {
  const grades = student.grades || [];
  const attendances = student.attendances || [];

  // Attendance percent
  const totalAttendance = attendances.length;
  const presentCount = attendances.filter(
    (a: any) => a.status === 'PRESENT' || a.status === 'LATE'
  ).length;
  const attendPct = totalAttendance > 0
    ? Math.round((presentCount / totalAttendance) * 100)
    : 0;

  if (grades.length === 0) {
    return `No grade data available yet; attendance ${attendPct}%.`;
  }

  const stats = computeSubjectStats(grades);
  const strong = stats.filter((s) => s.avgScore >= 75).map((s) => s.subject);
  const weak = stats.filter((s) => s.avgScore < 60).map((s) => s.subject);

  let summary = '';

  if (strong.length > 0) {
    summary += `Strong in ${strong.slice(0, 2).join(' & ')}`;
  }

  if (weak.length > 0) {
    summary += `${strong.length > 0 ? ', needs attention in' : 'Needs attention in'} ${weak.slice(0, 2).join(' & ')}`;
  }

  if (summary === '') {
    summary = 'Average performance across all subjects';
  }

  summary += `; attendance ${attendPct}%`;

  if (attendPct < config.attendanceThreshold) {
    summary += ' ⚠️';
  }

  return summary;
}

/**
 * GET /api/analytics/insights
 * Returns insights for all students (admin/teacher) or self (student).
 */
export async function getInsights(studentId?: string) {
  // Build query
  const where = studentId ? { id: studentId } : {};

  const students = await prisma.student.findMany({
    where,
    include: {
      user: { select: { name: true } },
      grades: true,
      attendances: {
        where: {
          date: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // last 90 days
        },
      },
    },
    take: 100,
  });

  const insights: StudentInsight[] = [];

  for (const student of students) {
    const totalAtt = student.attendances.length;
    const presentAtt = student.attendances.filter(
      (a) => a.status === 'PRESENT' || a.status === 'LATE'
    ).length;
    const attendancePercent = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;

    const subjectStats = computeSubjectStats(student.grades);
    const strongSubjects = subjectStats.filter((s) => s.avgScore >= 75).map((s) => s.subject);
    const weakSubjects = subjectStats.filter((s) => s.avgScore < 60).map((s) => s.subject);
    const decliningSubjects = subjectStats
      .filter((s) => s.trend === 'declining')
      .map((s) => s.subject);

    const riskFlags: string[] = [];
    if (attendancePercent < config.attendanceThreshold) {
      riskFlags.push(`LOW_ATTENDANCE: ${attendancePercent}%`);
    }
    if (weakSubjects.length >= 2) {
      riskFlags.push(`FAILING_MULTIPLE_SUBJECTS: ${weakSubjects.join(', ')}`);
    }
    if (decliningSubjects.length > 0) {
      riskFlags.push(`DECLINING_TREND: ${decliningSubjects.join(', ')}`);
    }

    const studySuggestions = buildSuggestions(
      attendancePercent,
      weakSubjects,
      decliningSubjects,
      strongSubjects
    );

    insights.push({
      studentId: student.id,
      name: student.user.name,
      attendancePercent,
      riskFlags,
      studySuggestions,
      subjectStats,
      strongSubjects,
      weakSubjects,
    });
  }

  // Sort: highest risk first
  insights.sort((a, b) => b.riskFlags.length - a.riskFlags.length);

  return insights;
}
