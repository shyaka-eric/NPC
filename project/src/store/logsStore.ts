import { create } from 'zustand';
import { Log } from '../types';
import { api } from '../api';

interface LogsState {
  logs: Log[];
  isLoading: boolean;
  error: string | null;

  // CRUD operations
  fetchLogs: () => Promise<void>;
  addLog: (userId: string, userName: string, action: string, details: string) => Promise<void>;
  getLogsByUserId: (userId: string) => Log[];
  getLogsByAction: (action: string) => Log[];
  getLogsByDateRange: (startDate: Date, endDate: Date) => Log[];
}

export const useLogsStore = create<LogsState>()((set, get) => ({
  logs: [],
  isLoading: false,
  error: null,

  fetchLogs: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('logs/');
      set({ logs: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  addLog: async (userId, userName, action, details) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('logs/', {
        user: userId,
        action,
        details,
      });
      // Optionally refetch logs or optimistically add
      await get().fetchLogs();
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  getLogsByUserId: (userId: string) => {
    return get().logs.filter(log => log.userId === userId);
  },

  getLogsByAction: (action: string) => {
    return get().logs.filter(log => log.action.includes(action));
  },

  getLogsByDateRange: (startDate: Date, endDate: Date) => {
    return get().logs.filter(log => {
      const timestamp = new Date(log.timestamp);
      return timestamp >= startDate && timestamp <= endDate;
    });
  }
}));