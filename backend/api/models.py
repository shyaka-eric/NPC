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
    phone_number = models.CharField(max_length=32, blank=True, null=True)

# 2. Item
class Item(models.Model):
    serial_number = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=100)
    quantity = models.IntegerField()
    expiration_date = models.DateField(blank=True, null=True)
    last_updated = models.DateTimeField(auto_now=True)

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
    NOTIF_TYPE_CHOICES = [
        ('success', 'Success'),
        ('error', 'Error'),
        ('info', 'Info'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=100)
    message = models.TextField()
    type = models.CharField(max_length=16, choices=NOTIF_TYPE_CHOICES, default='info')
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

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