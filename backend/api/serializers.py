from rest_framework import serializers
from .models import User, Item, Request, Notification, Log, Settings, RepairRequest, IssuedItem

class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role', 'first_name', 'last_name', 'name',
            'rank', 'birth_date', 'unit', 'phone_number', 'is_active', 'password'
        ]
        extra_kwargs = {
            'username': {'required': True},
            'email': {'required': True},
            'role': {'required': True},
            'password': {'write_only': True}
        }

    def get_name(self, obj):
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name if full_name else obj.username

    def validate_username(self, value):
        user_id = self.instance.id if self.instance else None
        if not value:
            raise serializers.ValidationError('Username is required.')
        qs = User.objects.filter(username=value)
        if user_id:
            qs = qs.exclude(id=user_id)
        if qs.exists():
            raise serializers.ValidationError('A user with that username already exists.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

class ItemSerializer(serializers.ModelSerializer):
    assigned_to_id = serializers.PrimaryKeyRelatedField(source='assigned_to', read_only=True)
    assigned_to = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False, allow_null=True, write_only=True)
    assigned_quantity = serializers.SerializerMethodField()
    assigned_date = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = ['id', 'name', 'category', 'quantity', 'status', 'expiration_date', 'last_updated', 'assigned_to_id', 'assigned_to', 'assigned_quantity', 'assigned_date']

    def get_assigned_quantity(self, obj):
        # Get the most recent issued request for this item
        request = obj.requests.filter(status='issued').order_by('-requested_at').first()
        return request.quantity if request else None

    def get_assigned_date(self, obj):
        # Get the most recent issued request for this item
        request = obj.requests.filter(status='issued').order_by('-requested_at').first()
        return request.requested_at if request else None

class RequestSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.SerializerMethodField()
    item_name = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()

    class Meta:
        model = Request
        fields = [
            'id', 'item', 'item_name', 'category', 'quantity', 'status', 'priority', 'purpose',
            'requested_by', 'requested_by_name', 'requested_at', 'issued_item', 'type'
        ]
        read_only_fields = ['requested_by']

    def get_requested_by_name(self, obj):
        user = obj.requested_by
        if hasattr(user, 'get_full_name'):
            name = user.get_full_name()
            if name.strip():
                return name
        return getattr(user, 'username', None) or getattr(user, 'email', None) or str(user)

    def get_item_name(self, obj):
        return obj.item.name if obj.item else None

    def get_category(self, obj):
        return obj.item.category if obj.item else None

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'message', 'is_read', 'created_at', 'notification_type', 'request']
        read_only_fields = ['id', 'created_at']

class LogSerializer(serializers.ModelSerializer):
    class Meta:
        model = Log
        fields = '__all__'

class SettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Settings
        fields = '__all__'

class RepairRequestSerializer(serializers.ModelSerializer):
    serial_number = serializers.CharField(source='issued_item.serial_number', read_only=True)
    requested_by_name = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()

    class Meta:
        model = RepairRequest
        fields = ['id', 'item', 'issued_item', 'requested_by', 'requested_by_name', 'status', 'description', 'picture', 'serial_number', 'created_at', 'updated_at', 'type']
        read_only_fields = ['requested_by', 'serial_number', 'created_at', 'updated_at']

    def get_requested_by_name(self, obj):
        user = obj.requested_by
        if hasattr(user, 'get_full_name'):
            name = user.get_full_name()
            if name.strip():
                return name
        return getattr(user, 'username', None) or getattr(user, 'email', None) or str(user)

    def get_type(self, obj):
        return 'repair'

class IssuedItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_category = serializers.CharField(source='item.category', read_only=True)

    class Meta:
        model = IssuedItem
        fields = ['id', 'item', 'item_name', 'item_category', 'assigned_to', 'assigned_date', 'serial_number']