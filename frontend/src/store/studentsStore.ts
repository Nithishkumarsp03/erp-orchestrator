/**
 * Students Store (Zustand)
 * ------------------------
 * Normalised store for student entities with:
 *  - Optimistic updates (immediate UI change, rollback on error)
 *  - In-memory caching (stale-while-revalidate)
 *  - Pagination state
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '../utils/api';
import type { Student, PaginatedResponse } from '../types';

interface StudentsState {
  // Normalized entity map: id -> Student
  entities: Record<string, Student>;
  // Ordered list of IDs for the current page
  ids: string[];
  // Current selected student
  selectedStudent: Student | null;
  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  } | null;
  isLoading: boolean;
  error: string | null;
  // Cache timestamp
  lastFetched: number | null;

  // Actions
  fetchStudents: (params?: Record<string, any>, forceRefresh?: boolean) => Promise<void>;
  fetchStudent: (id: string) => Promise<Student>;
  createStudent: (data: any) => Promise<Student>;
  updateStudent: (id: string, data: any) => Promise<Student>;
  deleteStudent: (id: string) => Promise<void>;
  setSelected: (student: Student | null) => void;
  clearError: () => void;
}

const CACHE_TTL = 30_000; // 30 seconds

export const useStudentsStore = create<StudentsState>()(
  devtools(
    (set, get) => ({
      entities: {},
      ids: [],
      selectedStudent: null,
      pagination: null,
      isLoading: false,
      error: null,
      lastFetched: null,

      fetchStudents: async (params: Record<string, any> = {}, forceRefresh = false) => {
        // Stale-while-revalidate: skip if cache is fresh
        const { lastFetched } = get();
        if (!forceRefresh && lastFetched && Date.now() - lastFetched < CACHE_TTL) {
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const res = await api.get('/students', { params });
          const { students, pagination } = res.data.data;

          const entities: Record<string, Student> = {};
          students.forEach((s: Student) => { entities[s.id] = s; });

          set({
            entities: { ...get().entities, ...entities },
            ids: students.map((s: Student) => s.id),
            pagination,
            isLoading: false,
            lastFetched: Date.now(),
          });
        } catch (err: any) {
          set({ isLoading: false, error: err.message });
        }
      },

      fetchStudent: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.get(`/students/${id}`);
          const { student } = res.data.data;
          set((s: StudentsState) => ({
            entities: { ...s.entities, [student.id]: student },
            selectedStudent: student,
            isLoading: false,
          }));
          return student;
        } catch (err: any) {
          set({ isLoading: false, error: err.message });
          throw err;
        }
      },

      createStudent: async (data: any) => {
        const res = await api.post('/students', data);
        const { student } = res.data.data;

        // Optimistic: add immediately to store
        set((s: StudentsState) => ({
          entities: { ...s.entities, [student.id]: student },
          ids: [student.id, ...s.ids],
          pagination: s.pagination
            ? { ...s.pagination, total: (s.pagination?.total || 0) + 1 }
            : null,
        }));

        return student;
      },

      updateStudent: async (id: string, data: any) => {
        // Optimistic update: immediately reflect changes
        const previous = get().entities[id];
        if (previous) {
          set((s: StudentsState) => ({
            entities: { ...s.entities, [id]: { ...previous, ...data } },
          }));
        }

        try {
          const res = await api.put(`/students/${id}`, data);
          const { student } = res.data.data;

          set((s: StudentsState) => ({
            entities: { ...s.entities, [student.id]: student },
            selectedStudent: s.selectedStudent?.id === id ? student : s.selectedStudent,
          }));

          return student;
        } catch (err) {
          // Rollback on error
          if (previous) {
            set((s: StudentsState) => ({ entities: { ...s.entities, [id]: previous } }));
          }
          throw err;
        }
      },

      deleteStudent: async (id: string) => {
        // Optimistic remove
        const previous = get().entities[id];
        set((s: StudentsState) => {
          const { [id]: _, ...rest } = s.entities;
          return {
            entities: rest,
            ids: s.ids.filter((sid: string) => sid !== id),
            pagination: s.pagination
              ? { ...s.pagination, total: Math.max(0, (s.pagination?.total || 0) - 1) }
              : null,
          };
        });

        try {
          await api.delete(`/students/${id}`);
        } catch (err) {
          // Rollback
          if (previous) {
            set((s: StudentsState) => ({
              entities: { ...s.entities, [id]: previous },
              ids: [id, ...s.ids],
            }));
          }
          throw err;
        }
      },

      setSelected: (student: Student | null) => set({ selectedStudent: student }),
      clearError: () => set({ error: null }),
    }),
    { name: 'students-store' }
  )
);
