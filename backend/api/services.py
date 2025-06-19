from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification, User, IssuedItem
from django.utils import timezone

def send_notification(recipient_id, notification_type, message):
    """
    Send a notification to a specific user
    """
    try:
        # Create notification in database (remove 'request' kwarg)
        notification = Notification.objects.create(
            user_id=recipient_id,
            notification_type=notification_type,
            message=message,
            is_read=False
        )

        # Send notification through WebSocket
        channel_layer = get_channel_layer()
        notification_data = {
            "type": "send_notification",
            "message": message,
            "notification_type": notification_type,
            "data": {
                "notification_id": notification.id,
                "created_at": notification.created_at.isoformat(),
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
    Notify admins (not system-admins) when a new request is submitted
    """
    admins = User.objects.filter(role='admin')
    for admin in admins:
        send_notification(
            admin.id,
            'request_submitted',
            f'New request submitted by {request.requested_by.get_full_name()} for {request.item.name}'
        )

def notify_request_approved(request):
    """
    Notify logistics-officer and unit leader when a request is approved
    """
    logistics_users = User.objects.filter(role='logistics-officer')
    for user in logistics_users:
        send_notification(
            user.id,
            'request_approved',
            f'Request for {request.item.name} has been approved'
        )
    send_notification(
        request.requested_by.id,
        'request_approved',
        f'Your request for {request.item.name} has been approved'
    )

def notify_request_denied(request):
    """
    Notify unit leader when their request is denied
    """
    send_notification(
        request.requested_by.id,
        'request_denied',
        f'Your request for {request.item.name} has been denied'
    )

def notify_item_issued(request):
    """
    Notify unit leader when their item is issued and assign IssuedItem to the request.
    """
    for _ in range(request.quantity):
        issued_item = IssuedItem.objects.create(
            item=request.item,
            assigned_to=request.requested_by,
            assigned_date=timezone.now(),
        )
    request.issued_item = issued_item
    request.save()
    send_notification(
        request.requested_by.id,
        'item_issued',
        f'Your requested item {request.item.name} has been issued'
    )

def notify_repair_completed(repair_request):
    Notification.objects.create(
        user=repair_request.requested_by,
        message=f'Your repair request for {repair_request.issued_item.item.name} (S/N: {repair_request.issued_item.serial_number}) has been completed.',
        notification_type='repair_completed'
    )

def notify_item_deleted_by_logistics_officer(deleting_user, item):
    """
    Notify all system-admins when a logistics officer deletes an item from stock.
    """
    print(f"DEBUG: notify_item_deleted_by_logistics_officer called by {deleting_user} with role {getattr(deleting_user, 'role', None)}")
    if getattr(deleting_user, 'role', None) == 'logistics-officer':
        system_admins = User.objects.filter(role='system-admin')
        print(f"DEBUG: Found system_admins: {[a.username for a in system_admins]}")
        for admin in system_admins:
            print(f"DEBUG: Sending notification to {admin.username}")
            send_notification(
                admin.id,
                'item_deleted',
                f'Logistics Officer {deleting_user.get_full_name() or deleting_user.username} deleted item: {item.name}'
            )