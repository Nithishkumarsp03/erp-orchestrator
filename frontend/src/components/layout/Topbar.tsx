import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import type { Notification } from '../../types';

// Map route paths to readable page titles
const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/students': 'Students',
  '/classes': 'Classes',
  '/attendance': 'Attendance',
  '/analytics': 'Analytics & Insights',
  '/settings': 'Settings',
  '/audit': 'Audit Logs',
};

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const location = useLocation();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const title = TITLES[location.pathname] ||
    (location.pathname.startsWith('/students/') ? 'Student Profile' : 'EduDash');

  // Fetch notifications
  useEffect(() => {
    api.get('/notifications').then((res) => {
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unreadCount);
    }).catch(() => {});
  }, []);

  const markAllRead = async () => {
    await api.put('/notifications/read-all').catch(() => {});
    setNotifications((n) => n.map((notif) => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  return (
    <header className="h-16 flex items-center px-4 md:px-6 border-b border-surface-border/40 bg-surface-card/80 backdrop-blur-sm z-10 flex-shrink-0">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-surface-elevated mr-3"
        aria-label="Open menu"
      >
        <Bars3Icon className="w-5 h-5" />
      </button>

      {/* Page title */}
      <h1 className="text-lg font-semibold text-slate-100 mr-auto">{title}</h1>

      {/* Right section: search + notifications + avatar */}
      <div className="flex items-center gap-2">
        {/* Search (decorative — full search is on StudentsPage) */}
        <div className="hidden md:flex items-center gap-2 bg-surface-elevated border border-surface-border/40 rounded-lg px-3 py-1.5 w-48 focus-within:w-64 transition-all duration-300 focus-within:border-primary-500">
          <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="bg-transparent text-sm text-slate-300 placeholder-slate-500 outline-none w-full"
          />
        </div>

        {/* Notifications bell */}
        <div className="relative">
          <button
            id="notifications-btn"
            onClick={() => setShowNotifs((s) => !s)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-surface-elevated transition-colors"
            aria-label={`${unreadCount} unread notifications`}
          >
            <BellIcon className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowNotifs(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-surface-card border border-surface-border/40 rounded-xl shadow-2xl z-40 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border/40">
                    <h3 className="font-semibold text-slate-100">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-primary-400 hover:text-primary-300"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="py-8 text-center text-slate-400 text-sm">No notifications</p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`px-4 py-3 border-b border-surface-border/20 last:border-0 ${
                            !notif.read ? 'bg-primary-600/5' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {!notif.read && (
                              <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                            )}
                            <div className={!notif.read ? '' : 'ml-4'}>
                              <p className="text-sm font-medium text-slate-200">{notif.title}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{notif.message}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
