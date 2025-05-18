from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification, User, IssuedItem
from django.utils import timezone

def send_notification(recipient_id, notification_type, message, request=None):
    """
    Send a notification to a specific user
    """
    try:
        # Create notification in database
        notification = Notification.objects.create(
            user_id=recipient_id,
            notification_type=notification_type,
            message=message,
            is_read=False,
            request=request
        )

        # Send notification through WebSocket
        channel_layer = get_channel_layer()
        notification_data = {
            "type": "send_notification",
            "message": message,
            "notification_type": notification_type,
            "data": {
                "notification_id": str(notification.id),
                "created_at": notification.created_at.isoformat(),
                "request_id": str(request.id) if request else None
            }
        }

        async_to_sync(channel_layer.group_send)(
            f"user_{recipient_id}_notifications",
            notification_data
        )
        
        return notification
    except Exception as e:
        print(f"Error sending notification: {str(e)}")
        return None

def notify_request_submitted(request):
    """
    Notify admins when a new request is submitted
    """
    admins = User.objects.filter(role='admin')
    for admin in admins:
        send_notification(
            admin.id,
            'request_submitted',
            f'New request submitted by {request.requested_by.get_full_name()} for {request.item.name}',
            request
        )

def notify_request_approved(request):
    """
    Notify logistics and unit leader when a request is approved
    """
    # Notify logistics
    logistics_users = User.objects.filter(role='logistics')
    for user in logistics_users:
        send_notification(
            user.id,
            'request_approved',
            f'Request for {request.item.name} has been approved',
            request
        )

    # Notify unit leader
    send_notification(
        request.requested_by.id,
        'request_approved',
        f'Your request for {request.item.name} has been approved',
        request
    )

def notify_request_denied(request):
    """
    Notify unit leader when their request is denied
    """
    send_notification(
        request.requested_by.id,
        'request_denied',
        f'Your request for {request.item.name} has been denied',
        request
    )

def notify_item_issued(request):
    """
    Notify unit leader when their item is issued and assign IssuedItem to the request.
    """
    # Create IssuedItem
    for _ in range(request.quantity):  # Create multiple IssuedItem records based on quantity
        issued_item = IssuedItem.objects.create(
            item=request.item,
            assigned_to=request.requested_by,
            assigned_date=timezone.now(),
            expiration_date=None  # Set expiration date if applicable
        )

    # Assign the last issued item to the request (for reference)
    request.issued_item = issued_item
    request.save()

    # Send notification
    send_notification(
        request.requested_by.id,
        'item_issued',
        f'Your requested item {request.item.name} has been issued',
        request
    )