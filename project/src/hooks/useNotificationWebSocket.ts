import { useEffect, useRef } from 'react';
import { useNotificationsStore } from '../store/notificationsStore';
import { useAuthStore } from '../store/authStore';

const useNotificationWebSocket = () => {
  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const { addNotification, incrementUnreadCount } = useNotificationsStore();
  const { user } = useAuthStore();

  useEffect(() => {
    // Only connect if user is authenticated
    if (!user) return;

    // Get the token from localStorage
    const token = localStorage.getItem('token');
    if (!token) return;

    // Construct WebSocket URL using the backend URL
    const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const wsUrl = `${wsProtocol}${window.location.hostname}:8000/ws/notifications/?token=${token}`;

    const connectWebSocket = () => {
      // Don't create a new connection if one already exists
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        return;
      }

      // Clear any existing reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = undefined;
      }

      // Close existing connection if any
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }

      websocketRef.current = new WebSocket(wsUrl);

      websocketRef.current.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
      };

      websocketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          if (data.message) {
            addNotification({
              id: data.data.notification_id,
              message: data.message,
              notification_type: data.notification_type,
              is_read: false,
              created_at: new Date(data.data.created_at),
              request: data.data.request_id,
              user: localStorage.getItem('userId') || ''
            });
            incrementUnreadCount();
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      websocketRef.current.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        
        // Only attempt to reconnect if we haven't exceeded max attempts
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
        } else {
          console.log('Max reconnection attempts reached');
        }
      };
    };

    connectWebSocket();

    // Clean up the WebSocket connection when the component unmounts
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = undefined;
      }
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
    };
  }, [user]); // Only depend on user changes

  return null;
};

export default useNotificationWebSocket; 