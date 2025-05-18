from rest_framework import routers
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    UserViewSet, ItemViewSet, RequestViewSet,
    NotificationViewSet, LogViewSet, SettingsViewSet,
    RegisterView, UserDetailView, EmailTokenObtainPairView, has_users, RepairRequestListView,
    IssuedItemListView, AllPendingRequestsView,
    NotificationListView,
    NotificationMarkAsReadView,
    NotificationMarkAllAsReadView,
)

router = routers.DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'items', ItemViewSet)
router.register(r'requests', RequestViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'logs', LogViewSet)
router.register(r'settings', SettingsViewSet)

urlpatterns = [
    path('auth/login/', EmailTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/user/', UserDetailView.as_view(), name='auth_user'),
    path('has_users/', has_users, name='has_users'),
    path('repair-requests/', RepairRequestListView.as_view(), name='repair-requests'),
    path('issued-items/', IssuedItemListView.as_view(), name='issued-items-list'),
    path('all-pending-requests/', AllPendingRequestsView.as_view(), name='all-pending-requests'),
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:pk>/mark_as_read/', NotificationMarkAsReadView.as_view(), name='notification-mark-as-read'),
    path('notifications/mark_all_as_read/', NotificationMarkAllAsReadView.as_view(), name='notification-mark-all-as-read'),
]

urlpatterns += router.urls