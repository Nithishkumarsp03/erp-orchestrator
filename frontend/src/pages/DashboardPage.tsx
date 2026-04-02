import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UserGroupIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../utils/api';
import type { DashboardKPIs, StudentInsight } from '../types';

// KPI card component
function KPICard({
  title,
  value,
  icon: Icon,
  color,
  change,
  changeLabel,
  delay = 0,
}: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  change?: number;
  changeLabel?: string;
  delay?: number;
}) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="kpi-card"
    >
      {/* Decorative gradient blob */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-10 ${color}`} />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2.5 rounded-xl ${color} bg-opacity-20`}>
            <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
          </div>
          {change !== undefined && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                isPositive ? 'text-accent-500' : 'text-danger-500'
              }`}
            >
              {isPositive ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>

        <p className="text-3xl font-display font-bold text-white mb-1">{value}</p>
        <p className="text-sm text-slate-400">{title}</p>
        {changeLabel && <p className="text-xs text-slate-500 mt-0.5">{changeLabel}</p>}
      </div>
    </motion.div>
  );
}

// Attendance heatmap cell colors
const attendanceColor = (pct: number) => {
  if (pct >= 90) return '#22c55e';
  if (pct >= 75) return '#3b82f6';
  if (pct >= 60) return '#f59e0b';
  return '#ef4444';
};

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

export default function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<Record<string, number>>({});
  const [insights, setInsights] = useState<StudentInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, insightsRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/analytics/insights'),
        ]);

        setKpis(dashRes.data.data.kpis);
        setAttendanceSummary(dashRes.data.data.attendanceSummary);
        setInsights(insightsRes.data.data.insights.slice(0, 5));
      } catch (err) {
        console.error('Dashboard fetch error', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Build pie chart data from attendance summary
  const pieData = Object.entries(attendanceSummary).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  // Synthetic trend data (last 6 weeks)
  const trendData = [
    { week: 'Week 1', attendance: 88, avgGrade: 72 },
    { week: 'Week 2', attendance: 85, avgGrade: 74 },
    { week: 'Week 3', attendance: 90, avgGrade: 71 },
    { week: 'Week 4', attendance: 82, avgGrade: 76 },
    { week: 'Week 5', attendance: 87, avgGrade: 78 },
    { week: 'Week 6', attendance: kpis?.avgAttendancePct || 84, avgGrade: kpis?.avgGradeScore || 75 },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-surface-card rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 h-64 bg-surface-card rounded-xl" />
          <div className="h-64 bg-surface-card rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Total Students"
          value={kpis?.totalStudents || 0}
          icon={UserGroupIcon}
          color="bg-primary-500"
          change={+3}
          changeLabel="vs last month"
          delay={0}
        />
        <KPICard
          title="Average Attendance"
          value={`${kpis?.avgAttendancePct || 0}%`}
          icon={ChartBarIcon}
          color="bg-accent-500"
          change={kpis?.avgAttendancePct ? kpis.avgAttendancePct - 80 : 0}
          changeLabel="vs 80% target"
          delay={0.1}
        />
        <KPICard
          title="Avg Grade Score"
          value={`${kpis?.avgGradeScore || 0}%`}
          icon={AcademicCapIcon}
          color="bg-violet-500"
          change={+2}
          changeLabel="vs last term"
          delay={0.2}
        />
        <KPICard
          title="At-Risk Students"
          value={kpis?.atRiskStudents || 0}
          icon={ExclamationTriangleIcon}
          color="bg-warning-500"
          change={kpis?.atRiskStudents ? -kpis.atRiskStudents : 0}
          changeLabel="need intervention"
          delay={0.3}
        />
      </div>

      {/* ── Charts Row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Attendance + Grade Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="xl:col-span-2 glass-card p-6"
        >
          <h3 className="font-semibold text-slate-100 mb-4">6-Week Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" tickSize={0} dy={8} />
              <YAxis domain={[50, 100]} tickSize={0} dx={-8} />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                }}
              />
              <Area
                type="monotone"
                dataKey="attendance"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#attendGrad)"
                name="Attendance %"
              />
              <Area
                type="monotone"
                dataKey="avgGrade"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#gradeGrad)"
                name="Avg Grade %"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-3 h-3 rounded-full bg-primary-500" /> Attendance %
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-3 h-3 rounded-full bg-accent-500" /> Avg Grade %
            </div>
          </div>
        </motion.div>

        {/* Attendance breakdown pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <h3 className="font-semibold text-slate-100 mb-4">Attendance Breakdown</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                {d.name}: {d.value}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── At-Risk students ──────────────────────────────────────── */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-100 flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-primary-400" />
              AI Insights — Students Needing Attention
            </h3>
            <Link
              to="/analytics"
              className="text-xs text-primary-400 hover:text-primary-300"
            >
              View all →
            </Link>
          </div>

          <div className="space-y-3">
            {insights.map((insight) => (
              <div
                key={insight.studentId}
                className="flex items-center gap-4 p-3 bg-surface-elevated/50 rounded-lg border border-surface-border/20"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {insight.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/students/${insight.studentId}`}
                    className="text-sm font-medium text-slate-200 hover:text-primary-400 transition-colors"
                  >
                    {insight.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-xs font-medium ${
                        insight.attendancePercent < 60
                          ? 'text-danger-500'
                          : insight.attendancePercent < 75
                          ? 'text-warning-500'
                          : 'text-accent-500'
                      }`}
                    >
                      {insight.attendancePercent}% attendance
                    </span>
                    {insight.riskFlags.length > 0 && (
                      <span className="badge-red">
                        {insight.riskFlags.length} risk flag{insight.riskFlags.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                {insight.studySuggestions[0] && (
                  <p className="hidden md:block text-xs text-slate-400 max-w-xs truncate">
                    {insight.studySuggestions[0]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
