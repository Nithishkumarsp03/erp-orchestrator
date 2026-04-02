/**
 * Axios API Client
 * ----------------
 * Pre-configured axios instance with:
 *  - Base URL from environment
 *  - Automatic Authorization header injection (access token from Zustand store)
 *  - Automatic token refresh on 401 responses
 *  - Request/response interceptors for error normalization
 */

import axios, { AxiosError, AxiosResponse } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Send cookies (refresh token)
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ── Token management ────────────────────────────────────────────────────────

let accessToken: string | null = null;
let isRefreshing = false;
// Queue of requests waiting for token refresh
let requestsQueue: Array<(token: string) => void> = [];

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

// ── Request interceptor: attach access token ────────────────────────────────

api.interceptors.request.use(
  (config) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 with token refresh ────────────────────

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If 401 and not already retrying (avoid infinite loop) and it's not the refresh endpoint itself
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
      if (isRefreshing) {
        // Queue the request until refresh completes
        return new Promise((resolve) => {
          requestsQueue.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh');
        const newToken = data.data.accessToken;
        setAccessToken(newToken);

        // Replay queued requests
        requestsQueue.forEach((callback) => callback(newToken));
        requestsQueue = [];

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        // Refresh failed — clear token and redirect to login
        setAccessToken(null);
        requestsQueue = [];
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    // Normalize error for consumers
    const message =
      (error.response?.data as any)?.message || error.message || 'An error occurred';
    const code = (error.response?.data as any)?.code || 'NETWORK_ERROR';

    return Promise.reject({ message, code, status: error.response?.status, data: error.response?.data });
  }
);

export default api;
