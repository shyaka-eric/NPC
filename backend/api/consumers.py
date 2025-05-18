import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from asgiref.sync import async_to_sync
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth.models import AnonymousUser
from .models import Notification

User = get_user_model()

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get token from query string
        query_string = self.scope.get('query_string', b'').decode()
        token = None
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=')[1]
                break

        if not token:
            await self.close()
            return

        try:
            # Validate token and get user
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            self.user = await self.get_user(user_id)
            
            if not self.user or not self.user.is_authenticated:
                await self.close()
                return

            # Join a group for the user to receive personal notifications
            await self.channel_layer.group_add(
                f"user_{self.user.id}_notifications",
                self.channel_name
            )
            await self.accept()
        except Exception as e:
            print(f"WebSocket authentication error: {str(e)}")
            await self.close()

    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return AnonymousUser()

    async def disconnect(self, close_code):
        if hasattr(self, 'user') and self.user.is_authenticated:
            # Leave the user group
            await self.channel_layer.group_discard(
                f"user_{self.user.id}_notifications",
                self.channel_name
            )

    # Receive message from WebSocket
    async def receive(self, text_data):
        # This consumer is primarily for sending notifications,
        # but you could add logic here to handle messages from the frontend
        pass

    # Receive notification from channel layer
    async def send_notification(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            "message": event["message"],
            "notification_type": event["notification_type"],
            "data": {
                "notification_id": event["data"]["notification_id"],
                "created_at": event["data"]["created_at"],
                "request_id": event["data"].get("request_id")
            }
        }))

@database_sync_to_async
def notify_admins(request):
    notification = Notification.objects.create(
        user=request.requested_by,
        message=f"New request submitted by {request.requested_by.username}",
        notification_type="request_submitted"
    )
    from channels.layers import get_channel_layer
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        'admin_notifications',
        {
            'type': 'send_notification',
            'message': notification.message,
            'notification_type': notification.notification_type,
            'created_at': notification.created_at.isoformat(),
        }
    )