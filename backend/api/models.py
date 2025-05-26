from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth import get_user_model

# 1. User (extend Django's User)
class User(AbstractUser):
    email = models.EmailField(unique=True)  # Ensure email is unique
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
    groups = models.ManyToManyField('auth.Group', related_name='api_user_set', blank=True)
    user_permissions = models.ManyToManyField('auth.Permission', related_name='api_user_set', blank=True)
    profile_image = models.ImageField(upload_to='profile_images/', blank=True, null=True)

# 2. Item
class Item(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('in-use', 'In Use'),
        ('maintenance', 'Maintenance'),
        ('retired', 'Retired'),
    ]
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='available')
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
    issued_item = models.ForeignKey('IssuedItem', null=True, blank=True, on_delete=models.SET_NULL, related_name='requests_issued_item')  # Only for repair
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requests')
    quantity = models.IntegerField()
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='pending')
    type = models.CharField(max_length=32, choices=REQUEST_TYPE_CHOICES)
    priority = models.CharField(max_length=32, choices=PRIORITY_CHOICES, default='normal')
    purpose = models.TextField(blank=True, null=True)
    requested_at = models.DateTimeField(auto_now_add=True)

# 4. Notification
class Notification(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
        help_text='The user who should receive the notification.',
        null=True, blank=True # Temporarily allow nulls
    )
    message = models.TextField(help_text='The content of the notification.')
    is_read = models.BooleanField(default=False, help_text='Whether the user has read the notification.')
    created_at = models.DateTimeField(auto_now_add=True, help_text='The date and time the notification was created.')
    notification_type = models.CharField(
        max_length=50,
        help_text='Type of notification (e.g., request_submitted, request_approved, item_issued).'
    )
    # Add fields to link to related objects if necessary, e.g., request, issued_item
    # request = models.ForeignKey('Request', on_delete=models.CASCADE, null=True, blank=True)
    # issued_item = models.ForeignKey('IssuedItem', on_delete=models.CASCADE, null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'

    def __str__(self):
        return f'Notification for {self.user.username}: {self.message[:50]}...'

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

class IssuedItem(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='issued_items')
    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='issued_items', null=True, blank=True)
    assigned_date = models.DateTimeField(auto_now_add=True)
    serial_number = models.CharField(max_length=100, unique=True, null=True, blank=True)  # Re-add unique constraint

    def save(self, *args, **kwargs):
        if not self.serial_number:
            def get_abbreviation(text):
                return ''.join(word[0].upper() for word in text.split() if word)
            unit = self.assigned_to.unit or 'UNK'
            category = self.item.category or 'UNK'
            item_name = self.item.name or 'UNK'
            # Find the next available item_number for this category and name
            existing_serials = IssuedItem.objects.filter(
                item__category=category,
                item__name=item_name
            ).exclude(serial_number__isnull=True).values_list('serial_number', flat=True)
            # Extract numbers from existing serials
            import re
            pattern = re.compile(r'/([0-9]{3})$')
            numbers = [int(m.group(1)) for s in existing_serials if (m := pattern.search(s))]
            next_number = max(numbers, default=0) + 1
            serial_number = f"NPC/{unit}/{get_abbreviation(category)}/{get_abbreviation(item_name)}/{next_number:03d}"
            # Ensure uniqueness
            while IssuedItem.objects.filter(serial_number=serial_number).exists():
                next_number += 1
                serial_number = f"NPC/{unit}/{get_abbreviation(category)}/{get_abbreviation(item_name)}/{next_number:03d}"
            self.serial_number = serial_number
        super().save(*args, **kwargs)

class RepairRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('repair-in-process', 'Repair In Process'),
        ('repaired', 'Repaired'),
        ('damaged', 'Damaged'),
    ]
    issued_item = models.ForeignKey('IssuedItem', on_delete=models.CASCADE, related_name='repair_requests')
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='repair_requests')
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='repair_requests')
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='pending')
    description = models.TextField(blank=True, null=True)
    picture = models.ImageField(upload_to='repair_pictures/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"RepairRequest({self.status})"

class DamagedItem(models.Model):
    issued_item = models.OneToOneField('IssuedItem', on_delete=models.CASCADE, related_name='damaged_item')
    repair_request = models.OneToOneField('RepairRequest', on_delete=models.SET_NULL, null=True, blank=True, related_name='damaged_item_record')
    marked_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='marked_as_damaged_items')
    marked_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Damaged: {self.issued_item.serial_number}"