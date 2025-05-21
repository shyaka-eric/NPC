from rest_framework import viewsets, generics, permissions, filters
from .models import User, Item, Request, Notification, Log, Settings, RepairRequest, IssuedItem
from .serializers import (
    UserSerializer, ItemSerializer, RequestSerializer,
    NotificationSerializer, LogSerializer, SettingsSerializer, RepairRequestSerializer, IssuedItemSerializer
)
from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from .services import (
    notify_request_submitted,
    notify_request_approved,
    notify_request_denied,
    notify_item_issued
)
from rest_framework_simplejwt.authentication import JWTAuthentication
import logging
from rest_framework.views import APIView
from rest_framework import status

logger = logging.getLogger(__name__)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        logger.debug("Received data: %s", request.data)
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error("Validation errors: %s", serializer.errors)
            return Response(serializer.errors, status=400)
        user = serializer.save(is_active=True)
        headers = self.get_success_headers(serializer.data)
        return Response(self.get_serializer(user).data, status=201, headers=headers)

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['assigned_to__id']

    def get_queryset(self):
        queryset = super().get_queryset()
        assigned_to = self.request.query_params.get('assigned_to')
        if assigned_to:
            queryset = queryset.filter(assigned_to_id=assigned_to)
        return queryset

class RequestViewSet(viewsets.ModelViewSet):
    queryset = Request.objects.select_related('item').all()
    serializer_class = RequestSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        request_type = self.request.query_params.get('type')
        if request_type:
            queryset = queryset.filter(type=request_type)
        return queryset

    def perform_create(self, serializer):
        request = serializer.save(requested_by=self.request.user)
        notify_request_submitted(request)

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        request = serializer.save()

        if old_status != request.status:
            if request.status == 'approved':
                notify_request_approved(request)
            elif request.status == 'denied':
                notify_request_denied(request)
            elif request.status == 'issued':
                notify_item_issued(request)
                # --- Create IssuedItem(s) if not already exists ---
                if not request.issued_item:
                    issued_items = []
                    for _ in range(request.quantity):
                        issued_item = IssuedItem.objects.create(
                            item=request.item,
                            assigned_to=request.requested_by
                        )
                        issued_items.append(issued_item)
                    # Link the first issued item to the request for backward compatibility
                    if issued_items:
                        request.issued_item = issued_items[0]
                        request.save(update_fields=['issued_item'])

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

class LogViewSet(viewsets.ModelViewSet):
    queryset = Log.objects.all()
    serializer_class = LogSerializer
    permission_classes = [permissions.IsAuthenticated]  # Ensure only authenticated users can access
    authentication_classes = [JWTAuthentication]  # Use JWT for authentication

    def get_queryset(self):
        logger.debug("Fetching logs for user: %s", self.request.user)
        return super().get_queryset()

class SettingsViewSet(viewsets.ModelViewSet):
    queryset = Settings.objects.all()
    serializer_class = SettingsSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

class UserDetailView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['email'] = serializers.EmailField()
        self.fields['password'] = serializers.CharField()
        self.fields.pop('username', None)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")
        from .models import User
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("No user with this email.")
        attrs = {"username": user.username, "password": password}
        return super().validate(attrs)

class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            from .serializers import UserSerializer
            from .models import User
            email = request.data.get('email')
            user = User.objects.get(email=email)
            response.data['user'] = UserSerializer(user).data
        return response

@api_view(['GET'])
@permission_classes([AllowAny])
def has_users(request):
    from .models import User
    return Response({'has_users': User.objects.exists()})

from rest_framework.views import APIView

class RepairRequestListView(APIView):
    def get(self, request):
        repair_requests = RepairRequest.objects.select_related('issued_item', 'item').all()
        serializer = RepairRequestSerializer(repair_requests, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        serializer = RepairRequestSerializer(data=data)
        if serializer.is_valid():
            repair_request = serializer.save(requested_by=request.user)
            return Response(RepairRequestSerializer(repair_request).data, status=201)
        return Response(serializer.errors, status=400)

class IssuedItemListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        issued_items = IssuedItem.objects.filter(assigned_to=request.user)
        serializer = IssuedItemSerializer(issued_items, many=True)
        print("Issued Items API Response:", serializer.data)  # Debug print
        return Response(serializer.data)

class AllPendingRequestsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # Get pending 'new' requests for this user
        requests = Request.objects.filter(requested_by=user, status='pending')
        # Get pending 'repair' requests for this user
        repair_requests = RepairRequest.objects.filter(requested_by=user, status='pending')

        # Serialize
        request_data = RequestSerializer(requests, many=True).data
        repair_data = RepairRequestSerializer(repair_requests, many=True).data

        # Normalize repair_data to match request_data fields
        from .models import Item
        for r in repair_data:
            r['type'] = 'repair'
            # Fetch item name and category from the related Item object
            if isinstance(r['item'], int):
                try:
                    item_obj = Item.objects.get(id=r['item'])
                    r['item_name'] = item_obj.name
                    r['category'] = item_obj.category
                except Item.DoesNotExist:
                    r['item_name'] = '-'
                    r['category'] = '-'
            else:
                r['item_name'] = r.get('item_name', '-')
                r['category'] = r.get('category', '-')
            r['quantity'] = 1  # Repairs are always quantity 1
            r['purpose'] = r.get('description', '')
            r['requested_at'] = r.get('created_at')
            # Keep status, requested_by, requested_by_name, etc.

        # Combine and sort by date
        all_requests = request_data + repair_data
        all_requests.sort(key=lambda x: x.get('requested_at', ''), reverse=True)

        return Response(all_requests)

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

class NotificationMarkAsReadView(generics.UpdateAPIView):
    queryset = Notification.objects.all()
    permission_classes = [IsAuthenticated]
    # We only need to update the is_read field
    serializer_class = NotificationSerializer # We still need a serializer, can use the main one

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        # Ensure the notification belongs to the authenticated user
        if instance.user != request.user:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        instance.is_read = True
        instance.save()
        # Return the updated notification
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class NotificationMarkAllAsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # Mark all unread notifications for the authenticated user as read
        count = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'message': f'Marked {count} notifications as read.'}, status=status.HTTP_200_OK)