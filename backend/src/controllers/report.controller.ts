/**
 * PDF Report Controller
 * --------------------
 * Generates a printable student report PDF using PDFKit.
 * GET /api/students/:id/report
 */

import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import prisma from '../db';
import { notFound, forbidden } from '../utils/errors';
import { generateStudentSummary } from '../services/insights.service';

export async function generateStudentReport(req: Request, res: Response) {
  const { id } = req.params;

  // RBAC: students can only print their own report
  if (req.user?.role === 'STUDENT') {
    const myStudent = await prisma.student.findFirst({ where: { userId: req.user.userId } });
    if (!myStudent || myStudent.id !== id) throw forbidden();
  }

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      class: { select: { name: true, teacher: { select: { name: true } } } },
      grades: { orderBy: [{ term: 'asc' }, { subject: 'asc' }] },
      attendances: { orderBy: { date: 'desc' }, take: 90 },
      notes: {
        where: { visibility: req.user?.role === 'STUDENT' ? 'PUBLIC' : undefined },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { author: { select: { name: true } } },
      },
    },
  });

  if (!student) throw notFound('Student');

  const summary = await generateStudentSummary(student);

  // Attendance calculations
  const totalAtt = student.attendances.length;
  const presentAtt = student.attendances.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
  const attendPct = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;

  // Grade average
  const avgGrade = student.grades.length > 0
    ? Math.round(student.grades.reduce((s, g) => s + (g.score / g.maxScore) * 100, 0) / student.grades.length)
    : 0;

  // Build PDF
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="report-${student.admissionNo}.pdf"`);

  doc.pipe(res);

  // ── Header ────────────────────────────────────────────────────────
  doc
    .fontSize(22)
    .fillColor('#1e40af')
    .text('Student Academic Report', { align: 'center' })
    .moveDown(0.3);

  doc
    .fontSize(10)
    .fillColor('#6b7280')
    .text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' })
    .moveDown(1);

  // ── Student Info ──────────────────────────────────────────────────
  doc.fontSize(14).fillColor('#111827').text('Student Information').moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').stroke().moveDown(0.3);

  const info = [
    ['Name', student.user.name],
    ['Email', student.user.email],
    ['Admission No.', student.admissionNo],
    ['Class', student.class?.name || 'N/A'],
    ['Class Teacher', student.class?.teacher?.name || 'N/A'],
    ['Date of Birth', student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'],
  ];

  doc.fontSize(11).fillColor('#374151');
  for (const [label, value] of info) {
    doc.text(`${label}: `, { continued: true }).fillColor('#111827').text(value).fillColor('#374151');
  }

  doc.moveDown(0.5);
  doc.fontSize(11).fillColor('#1d4ed8').text(`📊 Summary: ${summary}`).moveDown(1);

  // ── KPIs ──────────────────────────────────────────────────────────
  doc.fontSize(14).fillColor('#111827').text('Performance Overview').moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').stroke().moveDown(0.3);

  doc.fontSize(11).fillColor('#374151');
  doc.text(`Attendance: ${attendPct}% (${presentAtt}/${totalAtt} days)`);
  doc.text(`Average Grade: ${avgGrade}%`);
  doc.moveDown(1);

  // ── Grades Table ──────────────────────────────────────────────────
  if (student.grades.length > 0) {
    doc.fontSize(14).fillColor('#111827').text('Academic Grades').moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').stroke().moveDown(0.3);

    // Group by term
    const byTerm = new Map<string, typeof student.grades>();
    for (const g of student.grades) {
      const list = byTerm.get(g.term) || [];
      list.push(g);
      byTerm.set(g.term, list);
    }

    for (const [term, grades] of byTerm.entries()) {
      doc.fontSize(12).fillColor('#1e40af').text(term).moveDown(0.2);
      doc.fontSize(10).fillColor('#374151');

      for (const g of grades) {
        const pct = Math.round((g.score / g.maxScore) * 100);
        const bar = '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10));
        doc.text(`  ${g.subject.padEnd(20)} ${String(g.score).padStart(3)}/${g.maxScore}  ${pct}%  ${bar}`);
      }
      doc.moveDown(0.5);
    }
  }

  // ── Notes ─────────────────────────────────────────────────────────
  if (student.notes.length > 0) {
    doc.addPage();
    doc.fontSize(14).fillColor('#111827').text('Teacher Notes').moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').stroke().moveDown(0.3);

    for (const note of student.notes) {
      doc
        .fontSize(9)
        .fillColor('#6b7280')
        .text(`${note.author.name} • ${new Date(note.createdAt).toLocaleDateString()}`);
      doc.fontSize(11).fillColor('#111827').text(note.body).moveDown(0.5);
    }
  }

  // ── Footer ────────────────────────────────────────────────────────
  doc
    .fontSize(9)
    .fillColor('#9ca3af')
    .text('Confidential — Smart Student Information Dashboard', 50, 760, { align: 'center' });

  doc.end();
}
