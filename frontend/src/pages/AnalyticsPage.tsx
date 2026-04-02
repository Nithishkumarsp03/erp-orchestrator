import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import type { StudentInsight } from '../types';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import toast from 'react-hot-toast';

export default function AnalyticsPage() {
  const [insights, setInsights] = useState<StudentInsight[]>([]);
  const [selected, setSelected] = useState<StudentInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/insights').then((res) => {
      const data = res.data.data.insights;
      setInsights(data);
      if (data.length > 0) setSelected(data[0]);
    }).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  const handleExport = async () => {
    try {
      const res = await api.get('/analytics/insights/export', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'student_insights.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch { toast.error('Export failed'); }
  };

  const getRiskColor = (flags: string[]) => {
    if (flags.length === 0) return 'border-accent-500/30 bg-accent-600/5';
    if (flags.length === 1) return 'border-warning-500/30 bg-warning-600/5';
    return 'border-danger-500/30 bg-danger-600/5';
  };

  const radarData = selected?.subjectStats.map((s) => ({
    subject: s.subject.substring(0, 8),
    score: s.avgScore,
  })) || [];

  const trendData = selected?.subjectStats.map((s) => ({
    name: s.subject.substring(0, 8),
    avg: s.avgScore,
    trend: s.trend === 'improving' ? 1 : s.trend === 'declining' ? -1 : 0,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-primary-400" /> AI-Powered Insights
          </h2>
          <p className="text-sm text-slate-400">Deterministic heuristics on grade & attendance data</p>
        </div>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm py-2">
          <ArrowDownTrayIcon className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Student list ──────────── */}
        <div className="glass-card p-4 lg:col-span-1 space-y-2 overflow-y-auto max-h-[600px]">
          <h3 className="font-semibold text-slate-200 text-sm mb-3">
            {insights.length} Students Analysed
          </h3>
          {isLoading
            ? [...Array(5)].map((_, i) => <div key={i} className="h-16 bg-surface-elevated rounded-lg animate-pulse" />)
            : insights.map((ins) => (
                <button
                  key={ins.studentId}
                  onClick={() => setSelected(ins)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selected?.studentId === ins.studentId
                      ? 'border-primary-500/50 bg-primary-600/10'
                      : getRiskColor(ins.riskFlags)
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-200 truncate">{ins.name}</p>
                    {ins.riskFlags.length > 0 && (
                      <span className="badge-red ml-2 flex-shrink-0">{ins.riskFlags.length}⚠</span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${
                    ins.attendancePercent < 60 ? 'text-danger-400'
                    : ins.attendancePercent < 75 ? 'text-warning-500'
                    : 'text-accent-500'
                  }`}>
                    {ins.attendancePercent}% attendance
                  </p>
                </button>
              ))
          }
        </div>

        {/* ── Detail panel ──────────── */}
        {selected ? (
          <div className="lg:col-span-2 space-y-5">
            {/* Risk Flags */}
            {selected.riskFlags.length > 0 && (
              <div className="glass-card p-4 border border-danger-500/20">
                <h4 className="text-sm font-semibold text-danger-400 mb-2">⚠️ Risk Flags</h4>
                <ul className="space-y-1">
                  {selected.riskFlags.map((f, i) => (
                    <li key={i} className="text-sm text-slate-300">• {f}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Study Suggestions */}
            <div className="glass-card p-4">
              <h4 className="text-sm font-semibold text-primary-400 mb-3">💡 Study Suggestions for {selected.name}</h4>
              <ul className="space-y-2">
                {selected.studySuggestions.map((s, i) => (
                  <li key={i} className="text-sm text-slate-300 p-2 bg-surface-elevated/30 rounded-lg">{s}</li>
                ))}
              </ul>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {radarData.length > 0 && (
                <div className="glass-card p-4">
                  <h4 className="text-sm font-semibold text-slate-200 mb-3">Subject Radar</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {trendData.length > 0 && (
                <div className="glass-card p-4">
                  <h4 className="text-sm font-semibold text-slate-200 mb-3">Subject Averages</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tickSize={0} dy={8} style={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tickSize={0} dx={-8} style={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
                      <Bar dataKey="avg" radius={[4, 4, 0, 0]} fill="#3b82f6" name="Avg %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Strong / Weak */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-4">
                <h4 className="text-sm font-semibold text-accent-500 mb-2">✅ Strong Subjects</h4>
                {selected.strongSubjects.length > 0
                  ? selected.strongSubjects.map((s) => <p key={s} className="text-sm text-slate-300">• {s}</p>)
                  : <p className="text-sm text-slate-400">None identified</p>}
              </div>
              <div className="glass-card p-4">
                <h4 className="text-sm font-semibold text-danger-400 mb-2">📖 Needs Focus</h4>
                {selected.weakSubjects.length > 0
                  ? selected.weakSubjects.map((s) => <p key={s} className="text-sm text-slate-300">• {s}</p>)
                  : <p className="text-sm text-slate-400">None identified</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 glass-card flex items-center justify-center text-slate-400 min-h-64">
            Select a student to view insights
          </div>
        )}
      </div>
    </div>
  );
}
