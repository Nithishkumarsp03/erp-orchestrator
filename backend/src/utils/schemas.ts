/**
 * Zod Validation Schemas
 * ----------------------
 * Centralised input validation schemas using Zod.
 * All route handlers validate request bodies against these schemas.
 * Unknown fields are stripped (using .strict() or .strip()).
 */

import { z } from 'zod';

// ── Auth ──────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT']).default('STUDENT'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

// ── Students ────────────────────────────────────────────────────────────────

export const createStudentSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).optional().default('Student@1234'),
  admissionNo: z.string().min(1).max(50),
  classId: z.string().uuid().optional(),
  dob: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  meta: z.record(z.any()).optional().default({}),
});

export const updateStudentSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  admissionNo: z.string().min(1).max(50).optional(),
  classId: z.string().uuid().nullable().optional(),
  dob: z.string().optional(),
  meta: z.record(z.any()).optional(),
});

export const studentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  classId: z.string().uuid().optional(),
  sortBy: z.enum(['name', 'admissionNo', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ── Classes ──────────────────────────────────────────────────────────────────

export const createClassSchema = z.object({
  name: z.string().min(2).max(100),
  teacherId: z.string().uuid().optional(),
  schedule: z.record(z.any()).optional().default({}),
});

export const updateClassSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  teacherId: z.string().uuid().nullable().optional(),
  schedule: z.record(z.any()).optional(),
});

// ── Attendance ────────────────────────────────────────────────────────────────

export const recordAttendanceSchema = z.object({
  records: z.array(
    z.object({
      studentId: z.string().uuid(),
      classId: z.string().uuid(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']).default('PRESENT'),
    })
  ).min(1, 'At least one attendance record required').max(200, 'Max 200 records per request'),
});

export const attendanceQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']).optional(),
});

// ── Grades ────────────────────────────────────────────────────────────────────

export const createGradeSchema = z.object({
  studentId: z.string().uuid(),
  subject: z.string().min(1).max(100),
  score: z.number().min(0).max(1000),
  maxScore: z.number().min(1).max(1000).default(100),
  term: z.string().min(1).max(50),
});

export const updateGradeSchema = z.object({
  subject: z.string().min(1).max(100).optional(),
  score: z.number().min(0).max(1000).optional(),
  maxScore: z.number().min(1).max(1000).optional(),
  term: z.string().min(1).max(50).optional(),
});

// ── Notes ─────────────────────────────────────────────────────────────────────

export const createNoteSchema = z.object({
  studentId: z.string().uuid(),
  body: z.string().min(1).max(5000),
  visibility: z.enum(['PUBLIC', 'TEACHERS_ONLY', 'PRIVATE']).default('TEACHERS_ONLY'),
});

export const updateNoteSchema = z.object({
  body: z.string().min(1).max(5000).optional(),
  visibility: z.enum(['PUBLIC', 'TEACHERS_ONLY', 'PRIVATE']).optional(),
});
