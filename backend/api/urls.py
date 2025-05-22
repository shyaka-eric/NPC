from rest_framework import routers
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    UserViewSet, ItemViewSet, RequestViewSet,
    NotificationViewSet, LogViewSet, SettingsViewSet,
    RegisterView, UserDetailView, EmailTokenObtainPairView, has_users, RepairRequestViewSet,
    IssuedItemListView, AllPendingRequestsView,
    NotificationListView,
    NotificationMarkAsReadView,
    NotificationMarkAllAsReadView,
    DamagedItemViewSet,
)

router = routers.DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'items', ItemViewSet)
router.register(r'requests', RequestViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'logs', LogViewSet)
router.register(r'settings', SettingsViewSet)
router.register(r'repair-requests', RepairRequestViewSet)
router.register(r'damaged-items', DamagedItemViewSet)

urlpatterns = [
    path('auth/login/', EmailTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/user/', UserDetailView.as_view(), name='auth_user'),
    path('has_users/', has_users, name='has_users'),
    path('repair-requests/', RepairRequestViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='repair-requests'),
    path('repair-requests/<int:pk>/', RepairRequestViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='repair-request-detail'),
    path('issued-items/', IssuedItemListView.as_view(), name='issued-items-list'),
    path('all-pending-requests/', AllPendingRequestsView.as_view(), name='all-pending-requests'),
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:pk>/mark_as_read/', NotificationMarkAsReadView.as_view(), name='notification-mark-as-read'),
    path('notifications/mark_all_as_read/', NotificationMarkAllAsReadView.as_view(), name='notification-mark-all-as-read'),
]

urlpatterns += router.urls