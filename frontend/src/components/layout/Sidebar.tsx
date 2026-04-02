import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface NavItem {
  path: string;
  label: string;
  icon: React.ForwardRefExoticComponent<any>;
  roles?: string[];
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { path: '/students', label: 'Students', icon: UserGroupIcon },
  { path: '/classes', label: 'Classes', icon: AcademicCapIcon },
  { path: '/attendance', label: 'Attendance', icon: CalendarDaysIcon },
  { path: '/analytics', label: 'Analytics', icon: ChartBarIcon },
  { path: '/prompt', label: 'AI Prompt', icon: SparklesIcon, roles: ['ADMIN', 'TEACHER'] },
  { path: '/audit', label: 'Audit Log', icon: ClipboardDocumentListIcon, roles: ['ADMIN'] },
  { path: '/settings', label: 'Settings', icon: Cog6ToothIcon },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const filteredItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <div className="flex flex-col h-full bg-surface-card border-r border-surface-border/40 relative">
      {/* ── Logo ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 h-16 px-4 border-b border-surface-border/40">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
          <SparklesIcon className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <span className="font-display font-bold text-lg text-white whitespace-nowrap">
                EduDash
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Navigation ────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive
                ? `flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary-600/20 text-primary-400 
                   border border-primary-600/30 font-medium transition-all duration-200`
                : `flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 
                   hover:text-slate-100 hover:bg-surface-elevated transition-all duration-200`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-sm whitespace-nowrap overflow-hidden"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* ── User card ─────────────────────────────────────────────── */}
      <div className="border-t border-surface-border/40 p-3">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize truncate">{user?.role?.toLowerCase()}</p>
            </div>
          )}

          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Collapse toggle ───────────────────────────────────────── */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-surface-elevated border border-surface-border rounded-full flex items-center justify-center text-slate-400 hover:text-slate-100 transition-colors shadow-lg"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRightIcon className="w-3 h-3" />
        ) : (
          <ChevronLeftIcon className="w-3 h-3" />
        )}
      </button>
    </div>
  );
}
