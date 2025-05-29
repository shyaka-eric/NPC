// notificationsStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { NotificationModel } from '../models/notification.model'
import { api } from '../api'

interface NotificationsState {
  notifications: NotificationModel[]
  isLoading: boolean
  error: string | null
  unreadCount: number
  fetchNotifications(userId: string): Promise<void>
  markAsRead(id: string): Promise<void>
  markAllAsRead(userId: string): Promise<void>
  addNotification(notification: NotificationModel): void
}

export const useNotificationsStore = create<NotificationsState>()(
  persist<NotificationsState>(
    (set, get) => ({
      notifications: [],
      isLoading: false,
      error: null,
      unreadCount: 0,

      fetchNotifications: async (userId) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.get<NotificationModel[]>('notifications/', {
            params: { user: userId }
          })
          const notifications = data.map(n => ({
            ...n,
            created_at: new Date(n.created_at),
          }))
          set({
            notifications,
            unreadCount: notifications.filter(n => !n.is_read).length,
            isLoading: false
          })
        } catch (e: any) {
          set({ error: e.message, isLoading: false })
        }
      },

      markAsRead: async (id) => {
        set({ isLoading: true, error: null })
        try {
          await api.patch(`notifications/${id}/mark_as_read/`)
          set(state => {
            const updated = state.notifications.map(n =>
              n.id === id ? { ...n, is_read: true } : n
            )
            return {
              notifications: updated,
              unreadCount: updated.filter(n => !n.is_read).length,
              isLoading: false
            }
          })
        } catch (e: any) {
          set({ error: e.message, isLoading: false })
        }
      },

      markAllAsRead: async (userId) => {
  set({ isLoading: true, error: null })
  try {
    // a single POST to the mark-all endpoint
    await api.post(`notifications/mark_all_as_read/`)

    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, is_read: true })),
      unreadCount: 0,
      isLoading: false
    }))
  } catch (e: any) {
    set({ error: e.message, isLoading: false })
  }
},


      addNotification: (notification) => {
        set(state => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + (notification.is_read ? 0 : 1)
        }))
      },
    }),
    {
      name: 'notifications-storage',
      merge: (persisted: unknown, current) => {
        const persistedState = persisted as Partial<NotificationsState>
        const notifications = (persistedState?.notifications || []).map(n => ({
          ...n,
          created_at: new Date(n.created_at),
        }))
        return {
          ...current,
          ...persistedState,
          notifications
        }
      }
    }
  )
)
