import { useAuthStore } from '../store/authStore';

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Settings</h2>
        <p className="text-sm text-slate-400">Manage your account and preferences</p>
      </div>

      <div className="glass-card p-6 max-w-lg">
        <h3 className="font-semibold text-slate-200 mb-4">Account Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex gap-2">
            <span className="text-slate-400 w-24">Name:</span>
            <span className="text-slate-200">{user?.name}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-slate-400 w-24">Email:</span>
            <span className="text-slate-200">{user?.email}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-slate-400 w-24">Role:</span>
            <span className="text-slate-200 capitalize">{user?.role?.toLowerCase()}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-slate-400 w-24">Member since:</span>
            <span className="text-slate-200">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
