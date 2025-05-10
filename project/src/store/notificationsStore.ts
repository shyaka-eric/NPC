import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Notification } from '../types';
import { api } from '../api';

interface NotificationsState {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;

  // CRUD operations
  fetchNotifications: (userId: string) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'created_at'>) => Promise<Notification>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  
  // Additional operations
  getUnreadCount: (userId: string) => number;
  getNotificationsByUser: (userId: string) => Notification[];
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: [],
      isLoading: false,
      error: null,

      fetchNotifications: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get('notifications/', { params: { user: userId } });
          set({ notifications: response.data, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      addNotification: async (notificationData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('notifications/', notificationData);
          set(state => ({ notifications: [...state.notifications, response.data], isLoading: false }));
          return response.data;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      markAsRead: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await api.patch(`notifications/${id}/`, { read: true });
          set(state => ({
            notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
            isLoading: false
          }));
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      markAllAsRead: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          // Fetch all notifications for the user and mark them as read
          const response = await api.get('notifications/', { params: { user: userId } });
          const notifications = response.data;
          await Promise.all(notifications.map((n: Notification) =>
            api.patch(`notifications/${n.id}/`, { read: true })
          ));
          set(state => ({
            notifications: state.notifications.map(n => n.user === userId ? { ...n, read: true } : n),
            isLoading: false
          }));
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      deleteNotification: async (id) => {
        try {
          set(state => ({ 
            notifications: state.notifications.filter(notification => notification.id !== id)
          }));
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      getUnreadCount: (userId) => {
        return get().notifications.filter(n => n.user === userId && !n.read).length;
      },

      getNotificationsByUser: (userId) => {
        return get().notifications.filter(n => n.user === userId);
      }
    }),
    {
      name: 'notifications-storage'
    }
  )
);