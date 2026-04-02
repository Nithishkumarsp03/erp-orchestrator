import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import type { AuditLog } from '../types';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api.get('/audit', { params: { page, limit: 50 } }).then((res) => {
      setLogs(res.data.data.logs);
      setTotal(res.data.data.pagination.total);
    }).catch(() => {}).finally(() => setIsLoading(false));
  }, [page]);

  const actionColor = (action: string) => {
    if (action.includes('DELETE')) return 'text-danger-500';
    if (action.includes('CREATE')) return 'text-accent-500';
    if (action.includes('UPDATE')) return 'text-warning-500';
    return 'text-slate-400';
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Audit Logs</h2>
        <p className="text-sm text-slate-400">{total} events recorded</p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border/40 text-xs text-slate-400 uppercase tracking-wider">
                {['Time', 'User', 'Action', 'Resource', 'IP'].map((h) => (
                  <th key={h} className="text-left px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [...Array(8)].map((_, i) => (
                    <tr key={i} className="border-b border-surface-border/20">
                      {[...Array(5)].map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3 bg-surface-elevated rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                : logs.map((log, i) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-surface-border/20 hover:bg-surface-elevated/20"
                    >
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {log.user?.name || 'System'}
                      </td>
                      <td className={`px-4 py-3 font-mono text-xs ${actionColor(log.action)}`}>
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{log.resource}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{log.ip || '—'}</td>
                    </motion.tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
