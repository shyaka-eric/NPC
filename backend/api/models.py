from django.db import models
from django.contrib.auth.models import AbstractUser

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
    serial_number = models.CharField(max_length=100, blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.serial_number:
            # Generate serial number: NPC/{category_abbreviation}/{item_name_abbreviation}/{item_number}
            category_abbr = ''.join([w[0] for w in self.category.split()])[:3].upper()
            item_name_abbr = ''.join([w[0] for w in self.name.split()])[:3].upper()
            # Count how many items exist in this category so far (for item_number)
            count = Item.objects.filter(category=self.category).count() + 1
            self.serial_number = f"NPC/{category_abbr}/{item_name_abbr}/{count}"
        super().save(*args, **kwargs)

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

class IssuedItem(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='issued_items')
    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='issued_items')
    assigned_date = models.DateTimeField(auto_now_add=True)
    serial_number = models.CharField(max_length=100, unique=True, blank=True)
    expiration_date = models.DateField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.serial_number:
            # Generate serial number: NPC/{unit}/{category_abbreviation}/{item_name_abbreviation}/{item_number}
            unit = (self.assigned_to.unit or 'X').upper()
            category_abbr = ''.join([word[0] for word in self.item.category.split()]).upper()
            item_name_abbr = ''.join([word[0] for word in self.item.name.split()]).upper()
            count = IssuedItem.objects.filter(item=self.item).count() + 1
            item_number = str(count).zfill(3)  # Ensure three-digit format
            self.serial_number = f"NPC/{unit}/{category_abbr}/{item_name_abbr}/{item_number}"
        super().save(*args, **kwargs)

class RepairRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
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
        return f"RepairRequest({self.issued_item.serial_number}) - {self.status}"