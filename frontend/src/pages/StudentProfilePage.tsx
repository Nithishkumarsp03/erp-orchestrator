import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '../utils/api';
import type { Student, Grade, Attendance } from '../types';
import toast from 'react-hot-toast';

type Tab = 'overview' | 'attendance' | 'grades' | 'notes' | 'activity';

// Attendance heatmap component
function AttendanceHeatmap({ attendances }: { attendances: Attendance[] }) {
  const statusColors: Record<string, string> = {
    PRESENT: '#22c55e',
    LATE: '#f59e0b',
    EXCUSED: '#3b82f6',
    ABSENT: '#ef4444',
  };

  return (
    <div>
      <div className="flex gap-1 flex-wrap">
        {attendances.slice(0, 60).map((a) => (
          <div
            key={a.id}
            className="heatmap-cell"
            style={{ background: statusColors[a.status] || '#334155' }}
            title={`${a.date?.split('T')[0]} — ${a.status}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3">
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [studentRes, attendRes] = await Promise.all([
          api.get(`/students/${id}`),
          api.get(`/attendance/student/${id}/summary`),
        ]);
        setStudent(studentRes.data.data.student);
        setSummary(studentRes.data.data.summary);
        setAttendanceSummary(attendRes.data.data);
      } catch {
        toast.error('Failed to load student profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleDownloadReport = async () => {
    if (!id || !student) return;
    try {
      const res = await api.get(`/students/${id}/report`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${student.admissionNo}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch {
      toast.error('Failed to generate report');
    }
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: AcademicCapIcon },
    { key: 'attendance', label: 'Attendance', icon: CalendarDaysIcon },
    { key: 'grades', label: 'Grades', icon: AcademicCapIcon },
    { key: 'notes', label: 'Notes', icon: DocumentTextIcon },
    { key: 'activity', label: 'Activity', icon: ClockIcon },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 bg-surface-card rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-24 bg-surface-card rounded-xl" />
          <div className="h-24 bg-surface-card rounded-xl" />
          <div className="h-24 bg-surface-card rounded-xl" />
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-20">
        <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-slate-500 mb-3" />
        <p className="text-slate-400">Student not found</p>
        <Link to="/students" className="text-primary-400 text-sm mt-2 inline-block">← Back to students</Link>
      </div>
    );
  }

  // Build grade bar chart data by subject
  const gradesBySubject = (student.grades || []).reduce<Record<string, number[]>>((acc, g) => {
    const pct = Math.round((g.score / g.maxScore) * 100);
    acc[g.subject] = acc[g.subject] || [];
    acc[g.subject].push(pct);
    return acc;
  }, {});

  const gradeChartData = Object.entries(gradesBySubject).map(([subject, scores]) => ({
    subject: subject.substring(0, 8),
    avg: Math.round(scores.reduce((s, x) => s + x, 0) / scores.length),
  }));

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-accent-500';
    if (score >= 60) return 'text-warning-500';
    return 'text-danger-500';
  };

  return (
    <div className="space-y-6">
      {/* ── Back Link ─────────────────────────────────────── */}
      <Link
        to="/students"
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 w-fit"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to Students
      </Link>

      {/* ── Profile Card ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex flex-wrap items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
            {student.user.name.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-white">{student.user.name}</h2>
            <p className="text-slate-400 text-sm mb-2">{student.user.email}</p>

            {/* Auto-generated summary */}
            {summary && (
              <div className="flex items-start gap-2 p-2.5 bg-primary-600/10 border border-primary-600/20 rounded-lg text-sm text-primary-300 mb-3">
                <span>💡</span>
                <span>{summary}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-3 text-sm text-slate-400">
              <span>📋 {student.admissionNo}</span>
              {student.class && <span>🏫 {student.class.name}</span>}
              {student.dob && (
                <span>🎂 {new Date(student.dob).toLocaleDateString('en-IN')}</span>
              )}
            </div>
          </div>

          <button
            onClick={handleDownloadReport}
            className="btn-secondary flex items-center gap-2 text-sm py-2"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            Download Report
          </button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-surface-border/40">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {attendanceSummary?.attendancePercent ?? '--'}%
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Attendance</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {attendanceSummary?.total ?? '--'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Total Days</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {student.grades?.length ?? '--'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Grade Records</p>
          </div>
          <div className="text-center">
            {attendanceSummary?.flagged ? (
              <p className="text-2xl font-bold text-warning-500">⚠️</p>
            ) : (
              <p className="text-2xl font-bold text-accent-500">✓</p>
            )}
            <p className="text-xs text-slate-400 mt-0.5">Status</p>
          </div>
        </div>
      </motion.div>

      {/* ── Tabs ──────────────────────────────────────────── */}
      <div className="glass-card overflow-hidden">
        <div className="flex border-b border-surface-border/40 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-primary-500 text-primary-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-slate-200 mb-3">Personal Information</h4>
                <div className="space-y-2.5 text-sm">
                  {[
                    ['Name', student.user.name],
                    ['Email', student.user.email],
                    ['Admission No.', student.admissionNo],
                    ['Class', student.class?.name || 'N/A'],
                    ['Teacher', student.class?.teacher?.name || 'N/A'],
                    ['Date of Birth', student.dob ? new Date(student.dob).toLocaleDateString('en-IN') : 'N/A'],
                    ...(student.meta as any ? Object.entries(student.meta as Record<string, string>).map(([k, v]) => [k, v]) : []),
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-2">
                      <span className="text-slate-400 w-32 flex-shrink-0">{label}:</span>
                      <span className="text-slate-200">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {gradeChartData.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-200 mb-3">Subject Average Scores</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={gradeChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject" tickSize={0} dy={8} />
                      <YAxis domain={[0, 100]} tickSize={0} dx={-8} />
                      <Tooltip
                        contentStyle={{
                          background: '#1e293b',
                          border: '1px solid #475569',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="avg" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Avg %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[
                  { label: 'Present', value: attendanceSummary?.present, color: 'text-accent-500' },
                  { label: 'Absent', value: attendanceSummary?.absent, color: 'text-danger-500' },
                  { label: 'Late', value: attendanceSummary?.late, color: 'text-warning-500' },
                  { label: 'Excused', value: attendanceSummary?.excused, color: 'text-primary-400' },
                  { label: 'Total Days', value: attendanceSummary?.total, color: 'text-slate-200' },
                ].map((s) => (
                  <div key={s.label} className="text-center p-3 bg-surface-elevated/30 rounded-lg">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value ?? '--'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="font-semibold text-slate-200 mb-3">Attendance Heatmap (last 60 records)</h4>
                {student.attendances && <AttendanceHeatmap attendances={student.attendances} />}
              </div>
            </div>
          )}

          {/* Grades Tab */}
          {activeTab === 'grades' && (
            <div className="space-y-4">
              {student.grades && student.grades.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No grades recorded yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-border/40 text-xs text-slate-400 uppercase tracking-wider">
                        {['Subject', 'Term', 'Score', 'Max', 'Percentage'].map((h) => (
                          <th key={h} className="text-left px-3 py-2">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {student.grades?.map((g) => {
                        const pct = Math.round((g.score / g.maxScore) * 100);
                        return (
                          <tr key={g.id} className="border-b border-surface-border/20 hover:bg-surface-elevated/20">
                            <td className="px-3 py-2.5 font-medium text-slate-200">{g.subject}</td>
                            <td className="px-3 py-2.5 text-slate-400">{g.term}</td>
                            <td className="px-3 py-2.5 text-slate-300">{g.score}</td>
                            <td className="px-3 py-2.5 text-slate-400">{g.maxScore}</td>
                            <td className="px-3 py-2.5">
                              <span className={`font-semibold ${getScoreColor(pct)}`}>{pct}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-3">
              {!student.notes || student.notes.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No notes for this student</p>
              ) : (
                student.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 bg-surface-elevated/30 rounded-lg border border-surface-border/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-[10px] font-bold">
                          {note.author?.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-slate-300">{note.author?.name}</span>
                        <span className="badge-gray">{note.visibility.replace('_', ' ')}</span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(note.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">{note.body}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="text-center py-8 text-slate-400">
              <ClockIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>Activity log coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
