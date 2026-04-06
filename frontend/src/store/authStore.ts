/**
 * Auth Store (Zustand)
 * --------------------
 * Manages authentication state globally.
 * Access token stored in memory (NOT localStorage) for XSS protection.
 * Refresh token is in httpOnly cookie (handled by browser/server).
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api, { setAccessToken } from '../utils/api';
import type { User, Role, AuthState } from '../types';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        const res = await api.post('/auth/login', { email, password });
        const { accessToken, user } = res.data.data;

        setAccessToken(accessToken);
        set({ user, isAuthenticated: true, isLoading: false });
      },

      register: async (name: string, email: string, password: string, role: Role) => {
        await api.post('/auth/register', { name, email, password, role });
        // After register, log them in automatically
        const store = useAuthStore.getState();
        await store.login(email, password);
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } finally {
          setAccessToken(null);
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      // Called at app startup to restore session via refresh token cookie
      refreshSession: async () => {
        try {
          const res = await api.post('/auth/refresh');
          const { accessToken } = res.data.data;
          setAccessToken(accessToken);

          // Get current user
          const meRes = await api.get('/auth/me');
          set({ user: meRes.data.data.user, isAuthenticated: true, isLoading: false });
          return true;
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
          return false;
        }
      },

      updateUser: (partial: Partial<User>) => {
        set((s: AuthStore) => ({ user: s.user ? { ...s.user, ...partial } : null }));
      },
    }),
    { name: 'auth-store' }
  )
);
