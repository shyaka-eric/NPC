from rest_framework import routers
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    UserViewSet, ItemViewSet, RequestViewSet,
    NotificationViewSet, LogViewSet, SettingsViewSet,
    RegisterView, UserDetailView, EmailTokenObtainPairView, has_users, RepairRequestListView,
    IssuedItemListView
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
]

urlpatterns += router.urls