from django.test import TestCase
from .models import Notification, User
from .services import send_notification

class NotificationServiceTestCase(TestCase):
    def setUp(self):
        # Create a test user
        self.user = User.objects.create(username="testuser", email="testuser@example.com")

    def test_send_notification(self):
        # Call the send_notification function
        send_notification(
            recipient_id=self.user.id,
            notification_type="test_type",
            message="This is a test notification"
        )

        # Check if the notification was created
        notification = Notification.objects.get(recipient=self.user)
        self.assertEqual(notification.notification_type, "test_type")
        self.assertEqual(notification.message, "This is a test notification")
        self.assertIsNotNone(notification.createdAt)
