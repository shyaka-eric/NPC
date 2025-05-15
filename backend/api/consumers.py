import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from asgiref.sync import async_to_sync
from .models import Notification

User = get_user_model()

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if self.user.is_authenticated and self.user.role == 'admin':
            self.room_group_name = 'admin_notifications'
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def send_notification(self, event):
        await self.send(text_data=json.dumps(event))

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