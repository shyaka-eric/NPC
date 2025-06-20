from rest_framework import viewsets, generics, permissions, filters
from .models import User, Item, Request, Notification, Log, Settings, RepairRequest, IssuedItem, DamagedItem
from .serializers import (
    UserSerializer, ItemSerializer, RequestSerializer,
    NotificationSerializer, LogSerializer, SettingsSerializer, RepairRequestSerializer, IssuedItemSerializer,
    DamagedItemSerializer
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
    notify_item_issued,
    notify_repair_completed
)
from rest_framework_simplejwt.authentication import JWTAuthentication
import logging
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework import status
from .utils import log_action
from rest_framework.exceptions import PermissionDenied

# Test endpoint for frontend-backend connection
class TestConnectionView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({
            'status': 'success',
            'message': 'Backend is responding',
            'time': str(datetime.datetime.now()),
            'environment': {
                'is_production': not settings.DEBUG,
                'allowed_origins': settings.CORS_ALLOWED_ORIGINS
            }
        })
    
    def post(self, request):
        return Response({
            'status': 'success',
            'received_data': request.data,
            'message': 'POST request received'
        })
from rest_framework.parsers import MultiPartParser, FormParser

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

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        # Always return context with request for correct profile_image URL
        return Response(self.get_serializer(instance, context={'request': request}).data)

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
        # Exclude deleted items by default
        return queryset.exclude(status='deleted')

    @action(detail=False, methods=['get'], url_path='deleted', permission_classes=[IsAuthenticated])
    def deleted_items(self, request):
        # Only allow system-admins
        if not request.user.is_authenticated or request.user.role != 'system-admin':
            return Response({'detail': 'Not authorized.'}, status=403)
        deleted_items = Item.objects.filter(status='deleted')
        page = self.paginate_queryset(deleted_items)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(deleted_items, many=True)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        reason = request.data.get('deletion_reason') or request.data.get('reason')
        instance.status = 'deleted'
        if reason:
            instance.deletion_reason = reason
        instance.save()
        # Notify system-admins if deleted by logistics officer
        from .services import notify_item_deleted_by_logistics_officer
        notify_item_deleted_by_logistics_officer(request.user, instance)
        return Response({'detail': 'Item soft deleted.'}, status=200)

    def create(self, request, *args, **kwargs):
        # Accept both 'in-stock' and 'available' as equivalent for status
        data = request.data.copy()
        status_value = data.get('status')
        if status_value == 'in-stock':
            data['status'] = 'available'
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save()
        headers = self.get_success_headers(serializer.data)
        return Response(self.get_serializer(item).data, status=201, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        old_status = instance.status
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        # Notify system-admins if status changed to 'deleted' by logistics officer
        if old_status != 'deleted' and serializer.validated_data.get('status') == 'deleted':
            from .services import notify_item_deleted_by_logistics_officer
            notify_item_deleted_by_logistics_officer(request.user, instance)
        # Always return context with request for correct profile_image URL
        return Response(self.get_serializer(instance, context={'request': request}).data)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_status = instance.status
        print(f"DEBUG: old_status={old_status}")
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        new_status = serializer.validated_data.get('status', instance.status)
        print(f"DEBUG: new_status={new_status}")
        # Notify system-admins if status changed to 'deleted' by logistics officer
        if old_status != 'deleted' and new_status == 'deleted':
            from .services import notify_item_deleted_by_logistics_officer
            notify_item_deleted_by_logistics_officer(request.user, instance)
        return Response(self.get_serializer(instance, context={'request': request}).data)

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
        # Default to 'new' type if not provided
        request_type = self.request.data.get('type', 'new')
        request = serializer.save(requested_by=self.request.user, type=request_type)
        notify_request_submitted(request)
        # Log the action
        log_action(self.request.user, 'Requested Item', f"Requested {request.quantity} x {request.item.name}")

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        request = serializer.save()

        if old_status != request.status:
            if request.status == 'approved':
                notify_request_approved(request)
                log_action(self.request.user, 'Approved Request', f"Approved request for {request.quantity} x {request.item.name}")
            elif request.status == 'denied':
                notify_request_denied(request)
                log_action(self.request.user, 'Denied Request', f"Denied request for {request.quantity} x {request.item.name}")
            elif request.status == 'issued':
                notify_item_issued(request)
                log_action(self.request.user, 'Issued Item', f"Issued {request.quantity} x {request.item.name}")
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
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')
    
    @action(detail=False, methods=['post'], url_path='mark-all-as-read')
    def mark_all_as_read(self, request):
        notifications = Notification.objects.filter(user=request.user, is_read=False)
        count = notifications.update(is_read=True)
        return Response({'marked_as_read': count}, status=status.HTTP_200_OK)


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

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            # Get user from validated data if not in request
            user = getattr(request, 'user', None)
            if not user or not user.is_authenticated:
                from django.contrib.auth import authenticate
                username = request.data.get('username')
                password = request.data.get('password')
                user = authenticate(username=username, password=password)
            if user and user.is_authenticated:
                log_action(user, 'Login', f'{user.username} logged in')
        return response

@api_view(['GET'])
@permission_classes([AllowAny])
def has_users(request):
    from .models import User
    return Response({'has_users': User.objects.exists()})

class RepairRequestViewSet(viewsets.ModelViewSet):
    queryset = RepairRequest.objects.select_related('issued_item', 'item').all()
    serializer_class = RepairRequestSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = super().get_queryset()
        requested_by = self.request.query_params.get('requested_by')
        if requested_by:
            queryset = queryset.filter(requested_by_id=requested_by)
        return queryset

    def create(self, request, *args, **kwargs):
        print('DEBUG RepairRequestViewSet.create request.data:', request.data)
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        repair_request = serializer.save()
        return Response(self.get_serializer(repair_request).data, status=201)

    @action(detail=True, methods=['patch'])
    def mark_repaired(self, request, pk=None):
        repair_request = self.get_object()
        # Only allow marking as repaired if status is 'repair-in-process'
        if repair_request.status != 'repair-in-process':
            return Response({'detail': 'Repair request is not in repair-in-process state.'}, status=status.HTTP_400_BAD_REQUEST)
        # Only allow logistics officer (fix: use correct role string)
        if not hasattr(request.user, 'role') or request.user.role != 'logistics-officer':
            raise PermissionDenied('Only logistics officers can mark as repaired.')
        repair_request.status = 'repaired'
        repair_request.save()

        # Notify the unit leader that the item is repaired
        notify_repair_completed(repair_request)

        serializer = self.get_serializer(repair_request)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def mark_repair_in_process(self, request, pk=None):
        repair_request = self.get_object()
        if repair_request.status != 'pending':
            return Response({'detail': 'Repair request is not pending.'}, status=status.HTTP_400_BAD_REQUEST)
        repair_request.status = 'repair-in-process'
        repair_request.save()
        serializer = self.get_serializer(repair_request)
        return Response(serializer.data)

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
            r['purpose'] = r.get('reason', '')
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

class DamagedItemViewSet(viewsets.ModelViewSet):
    queryset = DamagedItem.objects.select_related('issued_item__item', 'marked_by').all()
    serializer_class = DamagedItemSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        print(f"[DEBUG] DamagedItemViewSet.create called with data: {request.data}")
        repair_request_id = request.data.get('repair_request')
        if not repair_request_id:
            print("[DEBUG] No repair_request ID provided in request data.")
            return Response({'detail': 'repair_request ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
        existing_damaged = DamagedItem.objects.filter(repair_request__id=repair_request_id).first()
        if existing_damaged:
            return Response({
                'detail': 'This item is already marked as damaged.',
                'damaged_at': existing_damaged.marked_at,
                'marked_by': existing_damaged.marked_by.username if existing_damaged.marked_by else 'Unknown'
            }, status=status.HTTP_409_CONFLICT)
        try:
            repair_request = RepairRequest.objects.get(id=repair_request_id)
            print(f"[DEBUG] Found repair_request: {repair_request}")
            repair_request.status = 'damaged'
            repair_request.save()
            # Decrement item quantity and unassign issued item
            issued_item = repair_request.issued_item
            print(f"[DEBUG] Issued item for repair request {repair_request_id}: {issued_item}")
            if issued_item:
                item = issued_item.item
                print(f"[DEBUG] Item before decrement: {item.name}, quantity: {item.quantity}")
                item.quantity = max(item.quantity - 1, 0)
                item.save()
                print(f"[DEBUG] Item after decrement: {item.name}, quantity: {item.quantity}")
                issued_item.assigned_to = None
                issued_item.save()
                print(f"[DEBUG] Issued item after unassign: assigned_to={issued_item.assigned_to}")
            else:
                print(f"[DEBUG] No issued_item found for repair request {repair_request_id}")
            # Log the action
            log_action(request.user, 'Marked as Damaged', f"Marked item {repair_request.issued_item.item.name} (S/N: {repair_request.issued_item.serial_number}) as damaged")
            # Notify the unit leader to request a new item
            from .services import send_notification
            send_notification(
                repair_request.requested_by.id,
                'item_damaged',
                f'Your item {repair_request.issued_item.item.name} (S/N: {repair_request.issued_item.serial_number}) was marked as damaged. Please request a replacement.'
            )
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except RepairRequest.DoesNotExist:
            print(f"[DEBUG] RepairRequest with id {repair_request_id} does not exist.")
            return Response({'detail': f'Repair request with id {repair_request_id} not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"[DEBUG] Exception in DamagedItemViewSet.create: {e}")
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_dashboard_access(request):
    log_action(request.user, "Dashboard Access", f"{request.user.username} accessed the dashboard")
    return Response({"status": "logged"})