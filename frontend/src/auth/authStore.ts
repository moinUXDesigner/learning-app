import { create } from 'zustand';
import { apiClient, ensureCsrfCookie } from '../api/client';
import { ApiError } from '../api/types';
import type { Role, User } from '../types';

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: Role;
  organization_id?: number;
  [key: string]: unknown;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  /** Calls GET /api/me to restore session state on app boot. */
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    await ensureCsrfCookie();
    await apiClient.post('/api/login', { email, password });
    const { data } = await apiClient.get<{ user: User }>('/api/me');
    set({ user: data.user, isAuthenticated: true, isLoading: false });
  },

  register: async (payload) => {
    await ensureCsrfCookie();
    await apiClient.post('/api/register', payload);
    const { data } = await apiClient.get<{ user: User }>('/api/me');
    set({ user: data.user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await ensureCsrfCookie();
    await apiClient.post('/api/logout');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  fetchMe: async () => {
    set({ isLoading: true });
    try {
      await ensureCsrfCookie();
      const { data } = await apiClient.get<{ user: User }>('/api/me');
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      // 401/419 (unauthenticated) is the expected case for a fresh visitor —
      // treat any failure here as "not logged in" rather than surfacing it.
      if (err instanceof ApiError) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
