from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Request, Notification, IssuedItem # Import Notification and IssuedItem models
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

User = get_user_model()

@receiver(post_save, sender=Request)
def notify_admin_on_new_request(sender, instance, created, **kwargs):
    if created: # Check if a new instance of Request was created
        # Find all admin users
        admins = User.objects.filter(role='admin')

        # Create and send notification to each admin
        for admin in admins:
            # Create Notification in the database
            notification = Notification.objects.create(
                user=admin,
                message=f"New request submitted by {instance.requested_by.username} ({instance.item.name}).",
                notification_type='request_submitted'
            )

            # Send real-time notification via Channels
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    # Assuming an 'admin_notifications' group or use individual user groups
                    # Let's use individual user groups for targeted notifications
                    f"user_{admin.id}", # Send to the specific admin's group
                    {
                        'type': 'send_notification', # Method in your consumer
                        'message': notification.message,
                        'notification_type': notification.notification_type,
                        'created_at': notification.created_at.isoformat(),
                        'is_read': notification.is_read,
                        'id': notification.id, # Include ID for frontend management
                    }
                )

@receiver(post_save, sender=Request)
def notify_users_on_request_approval(sender, instance, created, **kwargs):
    # Only proceed if it's not a new request (handled by notify_admin_on_new_request)
    if not created:
        try:
            # Fetch the old instance from the database to compare status
            old_instance = sender.objects.get(pk=instance.pk)
        except sender.DoesNotExist:
            return # Should not happen in post_save for existing instance

        # Check if status changed to 'approved'
        if old_instance.status != 'approved' and instance.status == 'approved':
            # Notify the unit leader who made the request
            requester = instance.requested_by
            notification_to_requester = Notification.objects.create(
                user=requester,
                message=f"Your request for {instance.item.name} ({instance.quantity}) has been approved.",
                notification_type='request_approved'
            )
            # Send real-time notification to requester
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    f"user_{requester.id}",
                    {
                        'type': 'send_notification',
                        'message': notification_to_requester.message,
                        'notification_type': notification_to_requester.notification_type,
                        'created_at': notification_to_requester.created_at.isoformat(),
                        'is_read': notification_to_requester.is_read,
                        'id': notification_to_requester.id,
                    }
                )

            # Notify all logistics officers
            logistics_officers = User.objects.filter(role='logistics-officer')
            for lo in logistics_officers:
                notification_to_lo = Notification.objects.create(
                    user=lo,
                    message=f"Request for {instance.item.name} ({instance.quantity}) by {requester.username} has been approved.",
                    notification_type='request_approved'
                )
                # Send real-time notification to logistics officer
                if channel_layer:
                    async_to_sync(channel_layer.group_send)(
                        f"user_{lo.id}",
                        {
                            'type': 'send_notification',
                            'message': notification_to_lo.message,
                            'notification_type': notification_to_lo.notification_type,
                            'created_at': notification_to_lo.created_at.isoformat(),
                            'is_read': notification_to_lo.is_read,
                            'id': notification_to_lo.id,
                        }
                    )

@receiver(post_save, sender=IssuedItem)
def notify_requester_on_item_issued(sender, instance, created, **kwargs):
    if created: # Check if a new IssuedItem was created
        # Try to find the associated Request that led to this IssuedItem
        # Assuming the Request's issued_item field is set when an item is issued
        try:
            # Find the Request where this IssuedItem is linked and the status is 'issued'
            # We might need to refine this logic based on your exact workflow
            related_request = Request.objects.get(issued_item=instance, status='issued')
            requester = related_request.requested_by

            # Create Notification for the unit leader
            notification_to_requester = Notification.objects.create(
                user=requester,
                message=f"Your request for {related_request.item.name} ({related_request.quantity}) has been issued.",
                notification_type='item_issued'
            )

            # Send real-time notification to requester
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    f"user_{requester.id}",
                    {
                        'type': 'send_notification',
                        'message': notification_to_requester.message,
                        'notification_type': notification_to_requester.notification_type,
                        'created_at': notification_to_requester.created_at.isoformat(),
                        'is_read': notification_to_requester.is_read,
                        'id': notification_to_requester.id,
                    }
                )

        except Request.DoesNotExist:
            # Handle cases where the IssuedItem wasn't directly linked to a Request in this way
            # Or if the Request status isn't yet 'issued' when IssuedItem is created
            print(f"DEBUG: IssuedItem {instance.id} created, but could not find a related 'issued' Request.")
            pass # No related request found, so no one to notify 