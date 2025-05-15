import { useNotificationsStore } from '../store/notificationsStore';

class WebSocketService {
    private ws: WebSocket | null = null;

    public connect(token: string) {
        const wsUrl = `ws://localhost:8000/ws/notifications/?token=${token}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Notification received:', data);

            // Update the notifications store
            const { addNotification, incrementUnreadCount } = useNotificationsStore.getState();
            addNotification({
                userId: data.userId,
                title: data.message,
                message: data.message,
                type: data.notification_type,
                recipient: data.recipient,
                read: false,
                createdAt: new Date(),
            });
            incrementUnreadCount();
        };

        this.ws.onclose = (event) => {
            console.log('WebSocket disconnected:', event.code);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    public disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

export const websocketService = new WebSocketService();