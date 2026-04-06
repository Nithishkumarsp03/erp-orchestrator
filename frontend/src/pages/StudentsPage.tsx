import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useStudentsStore } from '../store/studentsStore';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import type { Class } from '../types';
import toast from 'react-hot-toast';

// Debounce hook for search input
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function StudentsPage() {
  const { user } = useAuthStore();
  const { entities, ids, pagination, isLoading, fetchStudents, deleteStudent } = useStudentsStore();

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [page, setPage] = useState(1);
  const [classes, setClasses] = useState<Class[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const canEdit = user?.role === 'ADMIN' || user?.role === 'TEACHER';

  // Fetch classes for filter dropdown
  useEffect(() => {
    api.get('/classes').then((res) => setClasses(res.data.data.classes)).catch(() => {});
  }, []);

  // Fetch students when filters change
  useEffect(() => {
    fetchStudents(
      {
        page,
        limit: 20,
        search: debouncedSearch,
        classId: classFilter || undefined,
      },
      true // force refresh on filter change
    );
  }, [debouncedSearch, classFilter, page, fetchStudents]);

  const students = ids.map((id) => entities[id]).filter(Boolean);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This action cannot be undone.`)) return;
    try {
      await deleteStudent(id);
      toast.success(`${name} deleted successfully`);
    } catch {
      toast.error('Failed to delete student');
    }
  };

  const handleDownloadReport = async (id: string, admNo: string) => {
    try {
      const res = await api.get(`/students/${id}/report`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${admNo}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch {
      toast.error('Failed to generate report');
    }
  };

  const getBadgeClass = (avgScore?: number) => {
    if (avgScore === undefined) return 'badge-gray';
    if (avgScore >= 75) return 'badge-green';
    if (avgScore >= 60) return 'badge-yellow';
    return 'badge-red';
  };

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Students</h2>
          <p className="text-sm text-slate-400">
            {pagination?.total || 0} student{pagination?.total !== 1 ? 's' : ''} registered
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Link to="/students/new" className="btn-primary flex items-center gap-2 text-sm py-2">
              <PlusIcon className="w-4 h-4" />
              Add Student
            </Link>
          )}
        </div>
      </div>

      {/* ── Search & Filter bar ───────────────────────────────── */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-48 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="student-search"
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, email, or admission no..."
              className="input-field pl-9 text-sm"
            />
          </div>

          {/* Class filter */}
          <select
            value={classFilter}
            onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
            className="input-field w-48 text-sm"
          >
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────── */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Students table">
            <thead>
              <tr className="border-b border-surface-border/40">
                {['Student', 'Admission No.', 'Class', 'Email', 'Grades', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap last:text-right"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-surface-border/20">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-surface-elevated rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400">
                    <MagnifyingGlassIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No students found</p>
                    {search && (
                      <button onClick={() => setSearch('')} className="text-primary-400 text-sm mt-1">
                        Clear search
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {students.map((student: any, i: number) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-surface-border/20 hover:bg-surface-elevated/30 transition-colors"
                    >
                      {/* Name + avatar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {student.user.name.charAt(0)}
                          </div>
                          <div>
                            <Link
                              to={`/students/${student.id}`}
                              className="text-sm font-medium text-slate-200 hover:text-primary-400 transition-colors"
                            >
                              {student.user.name}
                            </Link>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-400 font-mono">
                        {student.admissionNo}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-300">
                        {student.class?.name || <span className="text-slate-500">—</span>}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-400">
                        {student.user.email}
                      </td>

                      <td className="px-4 py-3">
                        <span className={getBadgeClass(75)}>
                          {student._count?.grades || 0} grades
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/students/${student.id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-primary-400 hover:bg-primary-600/10 transition-colors"
                            title="View profile"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Link>

                          {canEdit && (
                            <Link
                              to={`/students/${student.id}?edit=true`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-warning-500 hover:bg-warning-500/10 transition-colors"
                              title="Edit student"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </Link>
                          )}

                          <button
                            onClick={() => handleDownloadReport(student.id, student.admissionNo)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-accent-500 hover:bg-accent-500/10 transition-colors"
                            title="Download PDF report"
                          >
                            <DocumentArrowDownIcon className="w-4 h-4" />
                          </button>

                          {user?.role === 'ADMIN' && (
                            <button
                              onClick={() => handleDelete(student.id, student.user.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-danger-500 hover:bg-danger-500/10 transition-colors"
                              title="Delete student"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border/40">
            <p className="text-xs text-slate-400">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p: number) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p: number) => Math.min(pagination.totalPages, p + 1))}
                disabled={!pagination.hasMore}
                className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
