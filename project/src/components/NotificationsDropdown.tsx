import React, { useEffect, useRef } from 'react';
import { useNotificationsStore } from '../store/notificationsStore';
import { formatRelativeTime } from '../utils/formatters'; // Assuming you have this utility
import Button from './ui/Button';
import { X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface NotificationsDropdownProps {
  onClose: () => void;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ onClose }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, isLoading, error, fetchNotifications, markAsRead, markAllAsRead } = useNotificationsStore();
  const { user } = useAuthStore();

  useEffect(() => {
    const userId = user?.id || localStorage.getItem('userId');
    if (userId) {
      fetchNotifications(userId);
    }
  }, [fetchNotifications, user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleMarkAsRead = async (notificationId: number | string) => {
    await markAsRead(String(notificationId));
    // Optionally close the dropdown after marking as read if desired
    // onClose();
  };

  const handleMarkAllAsRead = async () => {
    const userId = user?.id || localStorage.getItem('userId');
    if (userId) {
      await markAllAsRead(userId);
    }
    // Optionally close the dropdown after marking all as read if desired
    // onClose();
  };

  return (
    <div
      ref={dropdownRef}
      className="origin-top-right absolute right-0 mt-2 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
    >
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <p className="text-lg font-semibold text-slate-900">Notifications</p>
        <Button variant="ghost" size="sm" onClick={onClose}><X size={16} /></Button>
      </div>
      {isLoading && <div className="px-4 py-2 text-sm text-slate-500">Loading...</div>}
      {error && <div className="px-4 py-2 text-sm text-red-600">Error: {error}</div>}
      {!isLoading && !error && notifications.length === 0 && (
        <div className="px-4 py-2 text-sm text-slate-500">No notifications yet.</div>
      )}
      {!isLoading && !error && notifications.length > 0 && (
        <div className="py-1 max-h-60 overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start px-4 py-2 text-sm ${notification.is_read ? 'text-slate-500' : 'text-slate-900 font-medium'} hover:bg-slate-100`}
            >
              <div className="flex-1">
                <p>{notification.message}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {/* Use formatRelativeTime if available */}
                  {notification.created_at ? formatRelativeTime(new Date(notification.created_at)) : '-'}
                </p>
              </div>
              {!notification.is_read && (
                <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.id)} className="ml-2 flex-shrink-0">
                  Mark as Read
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
      {!isLoading && !error && notifications.length > 0 && unreadCount > 0 && (
        <div className="border-t border-slate-200 px-4 py-2">
          <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="w-full text-center">
            Mark All as Read
          </Button>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;