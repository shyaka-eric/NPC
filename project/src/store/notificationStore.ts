import { create } from 'zustand';
import { api } from '../api'; // Import the named export from the root api file

interface Notification {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  notification_type: string;
  // Add any other relevant fields from your backend Notification model
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  // Fetch historical notifications from the backend
  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      // We'll need a backend API endpoint for this, e.g., /api/notifications/
      const response = await api.get('/notifications/'); // TODO: Create this endpoint
      const notifications = response.data as Notification[];
      const unreadCount = notifications.filter(n => !n.is_read).length;
      set({ notifications, unreadCount, isLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Add a new real-time notification received via WebSocket
  addNotification: (notification) => {
    set((state) => {
      const newNotifications = [notification, ...state.notifications];
      // Ensure no duplicates based on ID (important if fetching history and receiving real-time)
       const uniqueNotifications = Array.from(new Map(newNotifications.map(item => [item['id'], item])).values());
      const newUnreadCount = state.unreadCount + (notification.is_read ? 0 : 1);
      return { notifications: uniqueNotifications, unreadCount: newUnreadCount };
    });
  },

  // Mark a specific notification as read
  markAsRead: async (notificationId) => {
    set((state) => {
        const updatedNotifications = state.notifications.map(n =>
            n.id === notificationId ? { ...n, is_read: true } : n
        );
        const newUnreadCount = updatedNotifications.filter(n => !n.is_read).length;
        return { notifications: updatedNotifications, unreadCount: newUnreadCount };
    });
    try {
        // We'll need a backend API endpoint to mark as read, e.g., /api/notifications/<id>/mark_as_read/
        await api.patch(`/notifications/${notificationId}/mark_as_read/`); // TODO: Create this endpoint
    } catch (error) {
        console.error(`Failed to mark notification ${notificationId} as read:`, error);
        // Optionally revert state or show error to user
    }
  },

    // Mark all notifications as read
    markAllAsRead: async () => {
        set((state) => {
            const allReadNotifications = state.notifications.map(n => ({ ...n, is_read: true }));
            return { notifications: allReadNotifications, unreadCount: 0 };
        });
        try {
            // We'll need a backend API endpoint for this, e.g., /api/notifications/mark_all_as_read/
            await api.post('/notifications/mark_all_as_read/'); // TODO: Create this endpoint
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
            // Optionally revert state or show error to user
        }
    },
})); 