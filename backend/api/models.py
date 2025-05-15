from django.db import models
from django.contrib.auth.models import AbstractUser

# 1. User (extend Django's User)
class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('system-admin', 'System Admin'),
        ('unit-leader', 'Unit Leader'),
        ('logistics-officer', 'Logistics Officer'),
    ]
    role = models.CharField(max_length=32, choices=ROLE_CHOICES)
    department = models.CharField(max_length=100, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True)
    rank = models.CharField(max_length=20, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    unit = models.CharField(max_length=100, blank=True)

# 2. Item
class Item(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('in-use', 'In Use'),
        ('maintenance', 'Maintenance'),
        ('retired', 'Retired'),
    ]
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='available')
    serial_number = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=100)
    quantity = models.IntegerField()
    expiration_date = models.DateField(blank=True, null=True)
    last_updated = models.DateTimeField(auto_now=True)
    assigned_to = models.ForeignKey('User', null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_items')

# 3. Request
class Request(models.Model):
    REQUEST_TYPE_CHOICES = [
        ('new', 'New Item'),
        ('repair', 'Repair'),
    ]
    PRIORITY_CHOICES = [
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('denied', 'Denied'),
        ('issued', 'Issued'),
        ('completed', 'Completed'),
    ]
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='requests')
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requests')
    quantity = models.IntegerField()
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='pending')
    type = models.CharField(max_length=32, choices=REQUEST_TYPE_CHOICES)
    priority = models.CharField(max_length=32, choices=PRIORITY_CHOICES, default='normal')
    purpose = models.TextField(blank=True, null=True)
    requested_at = models.DateTimeField(auto_now_add=True)

# 4. Notification
class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('request_submitted', 'Request Submitted'),
        ('request_approved', 'Request Approved'),
        ('request_denied', 'Request Denied'),
        ('item_issued', 'Item Issued'),
    ]

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    message = models.TextField()
    request = models.ForeignKey(Request, on_delete=models.CASCADE, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-createdAt']

# 5. Log
class Log(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=100)
    details = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

# 6. Settings
class Settings(models.Model):
    org_name = models.CharField(max_length=100)
    org_logo = models.URLField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)