from rest_framework import serializers
from .models import User, Item, Request, Notification, Log, Settings

class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'first_name', 'last_name', 'name', 'department', 'phone_number', 'is_active']
        extra_kwargs = {
            'username': {'required': True},
            'email': {'required': True},
            'role': {'required': True},
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

class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ['id', 'serial_number', 'name', 'category', 'quantity', 'expiration_date', 'last_updated']

class RequestSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Request
        fields = '__all__'

    def get_requested_by_name(self, obj):
        user = obj.requested_by
        if hasattr(user, 'get_full_name'):
            name = user.get_full_name()
            if name.strip():
                return name
        return getattr(user, 'username', None) or getattr(user, 'email', None) or str(user)

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class LogSerializer(serializers.ModelSerializer):
    class Meta:
        model = Log
        fields = '__all__'

class SettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Settings
        fields = '__all__'