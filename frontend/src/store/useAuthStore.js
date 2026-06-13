import { create } from 'zustand';
import api from '../services/api';

/**
 * useAuthStore — Zustand Global State
 * 
 * Zustand is a lightweight state management library (alternative to Redux/Context).
 * `create` returns a hook that any component can call to read or update global state.
 * No Provider wrapper needed — it just works globally.
 * 
 * This store manages:
 * - The logged-in user object
 * - The JWT token (persisted in localStorage)
 * - Auth actions: register, login, logout, checkAuth
 */
const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('chatwave_token') || null,
  isLoading: false,
  error: null,

  // -----------------------------------------------------------------------
  // REGISTER
  // -----------------------------------------------------------------------
  register: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', { username, email, password });

      // Save token to localStorage so it persists across browser refreshes
      localStorage.setItem('chatwave_token', data.token);

      set({ user: data.user, token: data.token, isLoading: false });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  // -----------------------------------------------------------------------
  // LOGIN
  // -----------------------------------------------------------------------
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });

      localStorage.setItem('chatwave_token', data.token);

      set({ user: data.user, token: data.token, isLoading: false });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  // -----------------------------------------------------------------------
  // LOGOUT
  // -----------------------------------------------------------------------
  logout: () => {
    localStorage.removeItem('chatwave_token');
    set({ user: null, token: null });
  },

  // -----------------------------------------------------------------------
  // CHECK AUTH (on page refresh/app load)
  // Verifies if the stored token is still valid and loads the user
  // -----------------------------------------------------------------------
  checkAuth: async () => {
    const token = localStorage.getItem('chatwave_token');
    if (!token) return set({ user: null, token: null });

    set({ isLoading: true });
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, token, isLoading: false });
    } catch {
      // Token is expired or invalid
      localStorage.removeItem('chatwave_token');
      set({ user: null, token: null, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
