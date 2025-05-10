import { useAuthStore } from '../store/authStore';
import { Permission, hasPermission } from '../utils/permissions';

export const usePermissions = () => {
  const { user } = useAuthStore();

  const checkPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  };

  const checkPermissions = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return permissions.every(permission => hasPermission(user.role, permission));
  };

  return {
    checkPermission,
    checkPermissions,
    user
  };
}; 