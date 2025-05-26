from rest_framework import serializers
from .models import User, Item, Request, Notification, Log, Settings, RepairRequest, IssuedItem, DamagedItem

class IssuedItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_category = serializers.CharField(source='item.category', read_only=True)

    class Meta:
        model = IssuedItem
        fields = ['id', 'item', 'item_name', 'item_category', 'assigned_to', 'assigned_date', 'serial_number']

class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    profile_image = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role', 'first_name', 'last_name', 'name',
            'rank', 'birth_date', 'unit', 'phone_number', 'is_active', 'password', 'profile_image'
        ]
        extra_kwargs = {
            'username': {'required': True},
            'email': {'required': True},
            'role': {'required': True},
            'password': {'write_only': True, 'required': True},
            'profile_image': {'required': False, 'allow_null': True, 'use_url': True},
        }

    def get_name(self, obj):
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name if full_name else obj.username

    def get_profile_image(self, obj):
        request = self.context.get('request', None)
        if obj.profile_image:
            url = obj.profile_image.url
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        return None

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

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        # Prevent is_active from being set to False if not provided
        if 'is_active' not in validated_data:
            validated_data['is_active'] = instance.is_active if instance else True
        # Handle profile_image file upload
        request = self.context.get('request', None)
        if request and hasattr(request, 'FILES') and 'profile_image' in request.FILES:
            instance.profile_image = request.FILES['profile_image']
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if 'profile_image' not in ret:
            ret['profile_image'] = None
        return ret

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
        fields = ['id', 'message', 'is_read', 'created_at', 'notification_type']
        read_only_fields = ['id', 'created_at']

class LogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Log
        fields = ['id', 'user', 'action', 'details', 'timestamp']

class SettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Settings
        fields = '__all__'

class RepairRequestSerializer(serializers.ModelSerializer):
    serial_number = serializers.CharField(source='issued_item.serial_number', read_only=True)
    requested_by_name = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    issued_item_id = serializers.PrimaryKeyRelatedField(
        queryset=IssuedItem.objects.all(), source='issued_item', write_only=True, required=True
    )
    issued_item = IssuedItemSerializer(read_only=True)
    item_name = serializers.SerializerMethodField()
    item_category = serializers.SerializerMethodField()

    class Meta:
        model = RepairRequest
        fields = [
            'id', 'item', 'issued_item', 'issued_item_id', 'requested_by', 'requested_by_name',
            'status', 'description', 'picture', 'serial_number', 'created_at', 'updated_at', 'type',
            'item_name', 'item_category'
        ]
        read_only_fields = ['requested_by', 'serial_number', 'created_at', 'updated_at']

    def create(self, validated_data):
        # Always set requested_by from the authenticated user
        validated_data['requested_by'] = self.context['request'].user
        return super().create(validated_data)

    def get_requested_by_name(self, obj):
        user = obj.requested_by
        if hasattr(user, 'get_full_name'):
            name = user.get_full_name()
            if name.strip():
                return name
        return getattr(user, 'username', None) or getattr(user, 'email', None) or str(user)

    def get_type(self, obj):
        return 'repair'

    def get_item_name(self, obj):
        try:
            return obj.issued_item.item.name
        except Exception:
            return None

    def get_item_category(self, obj):
        try:
            return obj.issued_item.item.category
        except Exception:
            return None

    def update(self, instance, validated_data):
        # Call the parent class's update method to handle standard field updates
        old_status = instance.status
        updated_repair_request = super().update(instance, validated_data)

        # If status changed to 'damaged' and wasn't already
        if updated_repair_request.status == 'damaged' and old_status != 'damaged':
            issued_item = updated_repair_request.issued_item
            item = issued_item.item
            # Decrement the quantity of the main Item
            item.quantity = max(item.quantity - 1, 0)
            item.save()
            # Unassign the issued item from the user (do not delete for traceability)
            issued_item.assigned_to = None
            issued_item.save()
            # Only create DamagedItem if not already exists
            if not hasattr(issued_item, 'damaged_item'):
                request_user = self.context.get('request').user if self.context.get('request', None) else None
                DamagedItem.objects.create(
                    issued_item=issued_item,
                    repair_request=updated_repair_request,
                    marked_by=request_user
                )
        # If status changed to 'repair-in-process', ensure no further admin actions allowed
        if updated_repair_request.status == 'repair-in-process' and old_status != 'repair-in-process':
            # Optionally assign to logistic officer here if you have such a field
            pass
        return updated_repair_request

class DamagedItemSerializer(serializers.ModelSerializer):
    issued_item = serializers.PrimaryKeyRelatedField(queryset=IssuedItem.objects.all())
    repair_request = serializers.PrimaryKeyRelatedField(queryset=RepairRequest.objects.all(), required=False, allow_null=True)
    item_name = serializers.SerializerMethodField()
    item_category = serializers.SerializerMethodField()
    issued_item_serial_number = serializers.CharField(source='issued_item.serial_number', read_only=True)
    marked_by_name = serializers.SerializerMethodField()

    class Meta:
        model = DamagedItem
        fields = ['id', 'issued_item', 'issued_item_serial_number', 'item_name', 'item_category', 'repair_request', 'marked_by', 'marked_by_name', 'marked_at']
        read_only_fields = ['id', 'issued_item_serial_number', 'item_name', 'item_category', 'marked_by', 'marked_by_name', 'marked_at']

    def get_item_name(self, obj):
        # Always fetch the item name from the issued_item at the time of marking as damaged
        if obj.issued_item and obj.issued_item.item:
            return obj.issued_item.item.name
        return None

    def get_item_category(self, obj):
        # Always fetch the item category from the issued_item at the time of marking as damaged
        if obj.issued_item and obj.issued_item.item:
            return obj.issued_item.item.category
        return None

    def get_marked_by_name(self, obj):
        user = obj.marked_by
        if user:
            if hasattr(user, 'get_full_name'):
                name = user.get_full_name()
                if name.strip():
                    return name
            return getattr(user, 'username', None) or getattr(user, 'email', None) or str(user)
        return None