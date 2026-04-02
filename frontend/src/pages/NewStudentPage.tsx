import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import type { Class } from '../types';

export default function NewStudentPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    admissionNo: '',
    classId: '',
    dob: '',
    allergies: '',
    bloodGroup: '',
  });

  useEffect(() => {
    // Only ADMIN or TEACHER can add a student
    if (user && user.role !== 'ADMIN' && user.role !== 'TEACHER') {
      toast.error('Unauthorized');
      navigate('/students');
    }

    api.get('/classes')
      .then(res => setClasses(res.data.data.classes))
      .catch(() => toast.error('Failed to load classes'));
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        admissionNo: formData.admissionNo,
        classId: formData.classId || undefined,
        dob: formData.dob || undefined,
        meta: {
          allergies: formData.allergies,
          bloodGroup: formData.bloodGroup,
        }
      };

      const res = await api.post('/students', payload);
      toast.success('Student added successfully');
      navigate(`/students/${res.data.data.student.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add student');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/students" className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-elevated transition-colors">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Add New Student</h2>
            <p className="text-sm text-slate-400">Register a new student and create their account.</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-300 border-b border-surface-border/40 pb-2">
              Account Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g. John Doe"
                />
              </div>
              
              <div>
                <label className="label">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="john.doe@example.com"
                />
              </div>

              <div>
                <label className="label">Temporary Password *</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Minimum 6 characters"
                  minLength={6}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-300 border-b border-surface-border/40 pb-2">
              Academic Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Admission Number *</label>
                <input
                  type="text"
                  name="admissionNo"
                  required
                  value={formData.admissionNo}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g. ADM-2024-001"
                />
              </div>
              
              <div>
                <label className="label">Assign to Class</label>
                <select
                  name="classId"
                  value={formData.classId}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">-- Select a class --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-300 border-b border-surface-border/40 pb-2">
              Personal Details (Optional)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="input-field [color-scheme:dark]"
                />
              </div>
              
              <div>
                <label className="label">Blood Group</label>
                <input
                  type="text"
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g. O+"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label">Allergies or Medical Conditions</label>
                <input
                  type="text"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g. Peanuts, Asthma"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/students')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? 'Adding...' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
