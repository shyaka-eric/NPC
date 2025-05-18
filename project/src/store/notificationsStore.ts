import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NotificationModel } from '../models/notification.model'; // Use the correct NotificationModel type
import { api } from '../api';

const log = (message: string, data?: any) => {
  console.debug(`[NotificationsStore] ${message}`, data);
};

interface NotificationsState {
  notifications: NotificationModel[];
  isLoading: boolean;
  error: string | null;
  unreadCount: number;

  // CRUD operations
  fetchNotifications: (userId: string) => Promise<void>;
  addNotification: (notification: Omit<NotificationModel, 'id' | 'created_at'>) => Promise<NotificationModel>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;

  // Additional operations
  getUnreadCount: (userId: string) => number;
  getNotificationsByUser: (userId: string) => NotificationModel[];
  incrementUnreadCount: () => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: [],
      isLoading: false,
      error: null,
      unreadCount: 0,

      fetchNotifications: async (userId) => {
        log('Fetching notifications', { userId });
        set({ isLoading: true, error: null });
        try {
          const response = await api.get('notifications/', { params: { user: userId } });
          log('Raw backend response:', response.data);
          const notifications = response.data.map((notification: NotificationModel) => ({
            ...notification,
            created_at: new Date(notification.created_at)
          }));
          log('Fetched notifications successfully', notifications);
          set({ notifications, isLoading: false });
        } catch (error: any) {
          log('Error fetching notifications', error.message);
          set({ error: error.message, isLoading: false });
        }
      },

      addNotification: async (notificationData) => {
        log('Adding notification', notificationData);
        // If the notification already has an ID, it's from WebSocket
        if ('id' in notificationData) {
          // Check if notification already exists to prevent duplicates
          const exists = get().notifications.some(n => n.id === notificationData.id);
          if (!exists) {
            const notification = {
              ...notificationData,
              created_at: new Date(notificationData.created_at)
            };
            set(state => ({ 
              notifications: [notification, ...state.notifications],
              isLoading: false 
            }));
            return notification;
          }
          return notificationData as NotificationModel;
        }
        
        // Otherwise, it's a new notification being created
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('notifications/', notificationData);
          log('Notification added successfully', response.data);
          const notification = {
            ...response.data,
            created_at: new Date(response.data.created_at)
          };
          set(state => ({ 
            notifications: [notification, ...state.notifications], 
            isLoading: false 
          }));
          return notification;
        } catch (error: any) {
          log('Error adding notification', error.message);
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      markAsRead: async (id) => {
        log('Marking notification as read', { id });
        set({ isLoading: true, error: null });
        try {
          await api.patch(`notifications/${id}/`, { is_read: true });
          log('Notification marked as read', { id });
          set(state => ({
            notifications: state.notifications.map(n => n.id === id ? { ...n, is_read: true } : n),
            isLoading: false
          }));
        } catch (error: any) {
          log('Error marking notification as read', error.message);
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      markAllAsRead: async (userId) => {
        log('Marking all notifications as read', { userId });
        set({ isLoading: true, error: null });
        try {
          const response = await api.get('notifications/', { params: { user: userId } });
          const notifications = response.data;
          log('Fetched notifications for marking as read', notifications);
          await Promise.all(notifications.map((n: NotificationModel) =>
            api.patch(`notifications/${n.id}/`, { is_read: true })
          ));
          log('All notifications marked as read', { userId });
          set(state => ({
            notifications: state.notifications.map(n => n.user === userId ? { ...n, is_read: true } : n),
            isLoading: false
          }));
        } catch (error: any) {
          log('Error marking all notifications as read', error.message);
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      deleteNotification: async (id) => {
        log('Deleting notification', { id });
        try {
          set(state => ({ 
            notifications: state.notifications.filter(notification => notification.id !== id)
          }));
          log('Notification deleted', { id });
        } catch (error) {
          log('Error deleting notification', (error as Error).message);
          set({ error: (error as Error).message });
          throw error;
        }
      },

      getUnreadCount: (userId) => {
        const count = get().notifications.filter(n => n.user === userId && !n.is_read).length;
        log('Getting unread count', { userId, count });
        return count;
      },

      getNotificationsByUser: (userId) => {
        const notifications = get().notifications.filter(n => n.user === userId);
        log('Getting notifications by user', { userId, notifications });
        return notifications;
      },

      incrementUnreadCount: () => {
        set((state) => ({ unreadCount: state.unreadCount + 1 }));
      },
    }),
    {
      name: 'notifications-storage'
    }
  )
);