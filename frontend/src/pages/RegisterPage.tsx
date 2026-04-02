import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import type { Role } from '../types';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT' as Role,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name || formData.name.length < 2) errs.name = 'Name must be at least 2 characters';
    if (!formData.email) errs.email = 'Email is required';
    if (formData.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(formData.password)) errs.password = 'Must include uppercase letter';
    if (!/[0-9]/.test(formData.password)) errs.password = 'Must include a number';
    if (!/[^A-Za-z0-9]/.test(formData.password)) errs.password = 'Must include special character';
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await register(formData.name, formData.email, formData.password, formData.role);
      toast.success('Account created! Welcome aboard 🎉');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
      setErrors({ general: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const roles: { value: Role; label: string; desc: string }[] = [
    { value: 'STUDENT', label: '🎓 Student', desc: 'View your own profile, grades & attendance' },
    { value: 'TEACHER', label: '👩‍🏫 Teacher', desc: 'Manage students, record attendance & grades' },
    { value: 'ADMIN', label: '⚙️ Admin', desc: 'Full access to all features & settings' },
  ];

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-lg"
      >
        <div className="glass-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-white leading-none">EduDash</h1>
              <p className="text-xs text-slate-400">Create your account</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Get started</h2>
          <p className="text-slate-400 text-sm mb-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              Sign in
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="p-3 bg-danger-600/10 border border-danger-600/30 rounded-lg text-danger-400 text-sm">
                {errors.general}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="reg-name" className="label">Full name</label>
                <input
                  id="reg-name"
                  type="text"
                  autoComplete="name"
                  value={formData.name}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  className={`input-field ${errors.name ? 'border-danger-500' : ''}`}
                  placeholder="Alice Johnson"
                />
                {errors.name && <p className="text-danger-400 text-xs mt-1">{errors.name}</p>}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="reg-email" className="label">Email address</label>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                  className={`input-field ${errors.email ? 'border-danger-500' : ''}`}
                  placeholder="you@example.com"
                />
                {errors.email && <p className="text-danger-400 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="reg-password" className="label">Password</label>
                <input
                  id="reg-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData((f) => ({ ...f, password: e.target.value }))}
                  className={`input-field ${errors.password ? 'border-danger-500' : ''}`}
                  placeholder="Min 8 chars, A-Z, 0-9, #"
                />
                {errors.password && <p className="text-danger-400 text-xs mt-1">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="reg-confirm" className="label">Confirm password</label>
                <input
                  id="reg-confirm"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData((f) => ({ ...f, confirmPassword: e.target.value }))}
                  className={`input-field ${errors.confirmPassword ? 'border-danger-500' : ''}`}
                  placeholder="Repeat password"
                />
                {errors.confirmPassword && (
                  <p className="text-danger-400 text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Role selection */}
            <div>
              <label className="label">Account type</label>
              <div className="grid grid-cols-1 gap-2">
                {roles.map((r) => (
                  <label
                    key={r.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      formData.role === r.value
                        ? 'border-primary-500 bg-primary-600/10'
                        : 'border-surface-border/40 hover:border-surface-border'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={formData.role === r.value}
                      onChange={(e) => setFormData((f) => ({ ...f, role: e.target.value as Role }))}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-200">{r.label}</p>
                      <p className="text-xs text-slate-400">{r.desc}</p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        formData.role === r.value ? 'border-primary-500' : 'border-slate-500'
                      }`}
                    >
                      {formData.role === r.value && (
                        <div className="w-2 h-2 rounded-full bg-primary-500" />
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-2.5 text-base"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
