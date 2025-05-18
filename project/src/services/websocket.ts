import { useNotificationsStore } from '../store/notificationsStore';

class WebSocketService {
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectTimeout: NodeJS.Timeout | null = null;

    public connect(token: string) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected');
            return;
        }

        const wsUrl = `ws://localhost:8000/ws/notifications/?token=${token}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Notification received:', data);

            // Update the notifications store
            const { addNotification, incrementUnreadCount } = useNotificationsStore.getState();
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
        };

        this.ws.onclose = (event) => {
            console.log('WebSocket disconnected:', event.code);
            this.ws = null;
            
            // Only attempt to reconnect if we haven't exceeded max attempts
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
                console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
                
                if (this.reconnectTimeout) {
                    clearTimeout(this.reconnectTimeout);
                }
                
                this.reconnectTimeout = setTimeout(() => {
                    if (token) {
                        this.connect(token);
                    }
                }, delay);
            } else {
                console.log('Max reconnection attempts reached');
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    public disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

export const websocketService = new WebSocketService();