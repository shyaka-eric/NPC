import { create } from 'zustand';
import { api } from '../api';
import { User } from '../types';

interface AuthState {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: Partial<User> & { password: string }) => Promise<void>;
  fetchUser: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  addUser: (userData: Partial<User> & { password: string }) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  toggleUserActive: (id: string, isActive: boolean) => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  users: [],
  isAuthenticated: false,
  error: null,

  login: async (email, password) => {
    set({ error: null });
    try {
      const response = await api.post('auth/login/', { email, password });
      const { user, access } = response.data;
      if (!access) throw new Error('No token received from backend');
      localStorage.setItem('token', access);
      set({ user, isAuthenticated: true });
    } catch (error: any) {
      set({ error: error.response?.data?.detail || error.message, isAuthenticated: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, isAuthenticated: false });
  },

  register: async (userData) => {
    set({ error: null });
    try {
      await api.post('auth/register/', userData);
    } catch (error: any) {
      set({ error: error.response?.data?.detail || error.message });
      throw error;
    }
  },

  fetchUser: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');
      const response = await api.get('auth/user/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ user: response.data, isAuthenticated: true });
    } catch (error: any) {
      set({ user: null, isAuthenticated: false });
    }
  },

  fetchUsers: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');
      const response = await api.get('users/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ users: response.data });
    } catch (error: any) {
      set({ users: [] });
    }
  },

  addUser: async (userData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('You are not authenticated. Please log in again.');
      await api.post('users/', userData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await get().fetchUsers();
    } catch (error: any) {
      set({ error: error.response?.data?.detail || error.message });
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('You are not authenticated. Please log in again.');
      await api.delete(`users/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await get().fetchUsers();
    } catch (error: any) {
      set({ error: error.response?.data?.detail || error.message });
      throw error;
    }
  },

  toggleUserActive: async (id, isActive) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('You are not authenticated. Please log in again.');
      await api.patch(`users/${id}/`, { is_active: isActive }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await get().fetchUsers();
    } catch (error: any) {
      set({ error: error.response?.data?.detail || error.message });
      throw error;
    }
  },
}));