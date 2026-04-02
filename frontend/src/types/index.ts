// TypeScript type definitions for the entire application

export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
export type NoteVisibility = 'PUBLIC' | 'TEACHERS_ONLY' | 'PRIVATE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  student?: {
    id: string;
    admissionNo: string;
    classId?: string;
  } | null;
}

export interface Student {
  id: string;
  userId: string;
  admissionNo: string;
  classId?: string | null;
  dob?: string | null;
  meta?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role?: Role;
  };
  class?: {
    id: string;
    name: string;
    teacher?: { name: string };
  } | null;
  grades?: Grade[];
  attendances?: Attendance[];
  notes?: Note[];
  _count?: {
    attendances: number;
    grades: number;
    notes: number;
  };
}

export interface Class {
  id: string;
  name: string;
  teacherId?: string | null;
  schedule?: Record<string, any>;
  createdAt: string;
  teacher?: {
    id: string;
    name: string;
    email: string;
  } | null;
  _count?: {
    students: number;
    attendances: number;
  };
}

export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  recordedBy: string;
  createdAt: string;
  student?: {
    id: string;
    user: { name: string };
  };
  class?: { name: string };
}

export interface Grade {
  id: string;
  studentId: string;
  subject: string;
  score: number;
  maxScore: number;
  term: string;
  createdAt: string;
  student?: { user: { name: string } };
}

export interface Note {
  id: string;
  studentId: string;
  authorId: string;
  body: string;
  visibility: NoteVisibility;
  createdAt: string;
  author?: { name: string; role: Role };
  student?: { user: { name: string } };
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  details?: Record<string, any>;
  ip?: string;
  createdAt: string;
  user?: { name: string; email: string; role: Role };
}

// ── API Response types ──────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  errors?: { field: string; message: string }[];
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// ── Dashboard types ──────────────────────────────────────────────────────────

export interface DashboardKPIs {
  totalStudents: number;
  totalClasses: number;
  avgAttendancePct: number;
  avgGradeScore: number;
  atRiskStudents: number;
}

// ── Insight types ─────────────────────────────────────────────────────────

export interface StudentInsight {
  studentId: string;
  name: string;
  attendancePercent: number;
  riskFlags: string[];
  studySuggestions: string[];
  subjectStats: {
    subject: string;
    avgScore: number;
    trend: 'improving' | 'declining' | 'stable';
    termScores: { term: string; score: number }[];
  }[];
  strongSubjects: string[];
  weakSubjects: string[];
}

// ── Auth types ───────────────────────────────────────────────────────────────

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
