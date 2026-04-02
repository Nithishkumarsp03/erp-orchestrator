import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import type { Class } from '../types';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function ClassesPage() {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', teacherId: '' });
  const canEdit = user?.role === 'ADMIN' || user?.role === 'TEACHER';

  const fetchClasses = () => {
    api.get('/classes').then((res) => {
      setClasses(res.data.data.classes);
    }).finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchClasses(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/classes', { name: formData.name });
      toast.success('Class created!');
      setShowModal(false);
      setFormData({ name: '', teacherId: '' });
      fetchClasses();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create class');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete class "${name}"?`)) return;
    try {
      await api.delete(`/classes/${id}`);
      setClasses((c) => c.filter((cls) => cls.id !== id));
      toast.success('Class deleted');
    } catch {
      toast.error('Failed to delete class');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Classes</h2>
          <p className="text-sm text-slate-400">{classes.length} classes registered</p>
        </div>
        {canEdit && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm py-2">
            <PlusIcon className="w-4 h-4" /> New Class
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-36 bg-surface-card rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map((cls, i) => (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 bg-primary-600/20 rounded-xl">
                  <AcademicCapIcon className="w-5 h-5 text-primary-400" />
                </div>
                {canEdit && user?.role === 'ADMIN' && (
                  <button
                    onClick={() => handleDelete(cls.id, cls.name)}
                    className="text-xs text-slate-500 hover:text-danger-400 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>

              <h3 className="font-semibold text-slate-100 mb-1">{cls.name}</h3>
              {cls.teacher && (
                <p className="text-sm text-slate-400">👩‍🏫 {cls.teacher.name}</p>
              )}

              <div className="flex gap-3 mt-3 pt-3 border-t border-surface-border/30 text-xs text-slate-400">
                <span>{cls._count?.students || 0} students</span>
                <span>{cls._count?.attendances || 0} attendance records</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create class modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-bold text-white mb-4">Create New Class</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Class Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  className="input-field"
                  placeholder="e.g., Class 10-A (Mathematics)"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-sm py-2">Cancel</button>
                <button type="submit" className="btn-primary text-sm py-2">Create Class</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
