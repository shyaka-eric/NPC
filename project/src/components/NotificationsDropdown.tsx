import React, { useEffect } from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNotificationsStore } from '../store/notificationsStore';
import { formatRelativeTime } from '../utils/formatters';

interface NotificationsDropdownProps {
  onClose: () => void;
  isMobile?: boolean;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  onClose,
  isMobile = false
}) => {
  const { user } = useAuthStore();
  const { notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotificationsStore(); // Include all necessary methods
  
  useEffect(() => {
    if (user) {
      console.debug('Fetching notifications for user:', user.id);
      fetchNotifications(user.id);
    } else {
      console.warn('No user found, skipping notification fetch');
    }
  }, [user, fetchNotifications]);

  if (!user) {
    console.warn('NotificationsDropdown rendered without a user');
    return null;
  }

  const userNotifications = notifications.filter(notification => notification.recipient === user.id);
  console.debug('Filtered user notifications:', userNotifications);

  const hasUnread = userNotifications.some(notification => !notification.read);
  console.debug('User has unread notifications:', hasUnread);

  const handleMarkAllAsRead = () => {
    markAllAsRead(user.id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <Bell className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <Bell className="h-5 w-5 text-amber-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div
      className={`absolute ${
        isMobile ? 'left-0 right-0 top-[4.5rem] mx-2' : 'right-0 mt-2 w-96'
      } bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50`}
    >
      <div className="py-2 divide-y divide-slate-200">
        <div className="px-4 py-3 flex justify-between items-center">
          <h3 className="text-sm font-medium text-slate-900">Notifications</h3>
          {hasUnread && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {userNotifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-1 text-sm text-slate-500">You have no notifications</p>
            </div>
          ) : (
            userNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 hover:bg-slate-50 ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
                role="button"
                tabIndex={0}
              >
                <div className="flex">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                    <p className="text-sm text-slate-600">{notification.message}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {(() => {
                        try {
                          return formatRelativeTime(notification.createdAt);
                        } catch (error) {
                          console.warn('Error formatting notification time:', error, notification);
                          return 'Invalid date';
                        }
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="px-4 py-2">
          <button
            onClick={onClose}
            className="w-full text-xs font-medium text-slate-500 hover:text-slate-700 text-center py-1"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationsDropdown;