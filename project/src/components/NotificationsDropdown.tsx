// NotificationsModal.tsx
import React, { useEffect, useRef } from 'react'
import { useNotificationsStore } from '../store/notificationsStore'
import { formatRelativeTime } from '../utils/formatters'
import Button from './ui/Button'
import { X } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

interface Props {
  onClose(): void
}

export default function NotificationsModal({ onClose }: Props) {
  const modalRef = useRef<HTMLDivElement>(null)
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  } = useNotificationsStore()
  const { user } = useAuthStore()

  // fetch on mount
  useEffect(() => {
    const uid = user?.id || localStorage.getItem('userId')
    if (uid) fetchNotifications(uid)
  }, [fetchNotifications, user])

  const onMark = async (id: string) => {
    await markAsRead(id)
    console.log(`Notification ${id} marked as read`)
  }

  const onMarkAll = async () => {
    console.log('Mark All clicked')
    const uid = user?.id || localStorage.getItem('userId')
    if (uid) {
      await markAllAsRead(uid)
      console.log('All notifications marked as read')
    }
  }

  return (
    <div className="fixed top-14 right-8 z-50 flex items-start justify-end">
      <div ref={modalRef} className="bg-white w-80 rounded-2xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        {isLoading && <p className="p-4 text-sm text-gray-500">Loading…</p>}
        {error && <p className="p-4 text-sm text-red-600">Error: {error}</p>}

        {!isLoading && !error && notifications.length === 0 && (
          <p className="p-4 text-sm text-gray-500">No notifications.</p>
        )}

        {!isLoading && !error && notifications.length > 0 && (
          <ul className="max-h-64 overflow-y-auto">
            {notifications.map(n => (
              <li
                key={n.id}
                className={`flex items-start px-4 py-2 ${n.is_read ? 'text-gray-500' : 'font-medium text-blue-800'} hover:bg-gray-100`}
              >
                <div className="flex-1">
                  <p>{n.message}</p>
                  <p className="text-xs text-gray-400">
                    {formatRelativeTime(new Date(n.created_at))}
                  </p>
                </div>
                {!n.is_read && (
                  <Button variant="ghost" size="sm" onClick={() => onMark(n.id)}>
                    Mark as read
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        {!isLoading && unreadCount > 0 && (
          <div className="border-t px-4 py-2">
            <Button onClick={onMarkAll} className="w-full text-center">
              Mark All as Read
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}