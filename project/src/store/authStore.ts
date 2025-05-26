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
  refreshToken: () => Promise<void>;
}

function normalizeUser(user: any): User {
  return {
    ...user,
    profileImage: user.profileImage || user.profile_image || '',
    phoneNumber: user.phoneNumber || user.phone_number || '',
    isActive: user.isActive ?? user.is_active ?? true,
    createdAt: user.createdAt ? new Date(user.createdAt) : (user.created_at ? new Date(user.created_at) : new Date()),
    updatedAt: user.updatedAt ? new Date(user.updatedAt) : (user.updated_at ? new Date(user.updated_at) : new Date()),
  };
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
      const { access } = response.data;
      if (!access) throw new Error('No token received from backend');
      localStorage.setItem('token', access);
      // Fetch user profile after login
      const userRes = await api.get('auth/user/', {
        headers: { Authorization: `Bearer ${access}` }
      });
      set({ user: normalizeUser(userRes.data), isAuthenticated: true });
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
      set({ user: normalizeUser(response.data), isAuthenticated: true });
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
      set({ users: response.data.map(normalizeUser) });
    } catch (error: any) {
      set({ users: [] });
    }
  },

  addUser: async (userData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('You are not authenticated. Please log in again.');
      let config = { headers: { Authorization: `Bearer ${token}` } };
      let data = userData;
      if (userData instanceof FormData) {
        // nothing extra needed
      } else {
        // Ensure is_active is always true for JSON
        data.is_active = true;
        // @ts-ignore
        config.headers['Content-Type'] = 'application/json';
      }
      await api.post('users/', data, config);
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

  refreshToken: async () => {
    try {
      const response = await api.post('auth/refresh/');
      const { access } = response.data;
      if (!access) throw new Error('Failed to refresh token');
      localStorage.setItem('token', access);
      set({ isAuthenticated: true });
    } catch (error: any) {
      set({ isAuthenticated: false });
      throw error;
    }
  },
}));