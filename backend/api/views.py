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
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from .services import (
    notify_request_submitted,
    notify_request_approved,
    notify_request_denied,
    notify_item_issued
)
from rest_framework_simplejwt.authentication import JWTAuthentication
import logging

logger = logging.getLogger(__name__)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        password = data.pop('password', None)
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save(is_active=True)
        if password:
            user.set_password(password)
            user.save()
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
                # Call notify_item_issued to handle item issuance
                notify_item_issued(request)

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

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
        repair_requests = RepairRequest.objects.select_related('issued_item').all()
        serializer = RepairRequestSerializer(repair_requests, many=True)
        return Response(serializer.data)

class IssuedItemListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        issued_items = IssuedItem.objects.filter(assigned_to=request.user)
        serializer = IssuedItemSerializer(issued_items, many=True)
        print("Issued Items API Response:", serializer.data)  # Debug print
        return Response(serializer.data)