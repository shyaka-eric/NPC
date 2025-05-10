import { UserRole } from '../types';

// Define permission types
export type Permission = 
  | 'view-dashboard'
  | 'manage-stock'
  | 'issue-items'
  | 'request-items'
  | 'request-repairs'
  | 'manage-users'
  | 'view-reports'
  | 'view-logs';

// Define role-based permissions
const rolePermissions: Record<UserRole, Permission[]> = {
  'unit-leader': [
    'view-dashboard',
    'request-items',
    'request-repairs'
  ],
  'admin': [
    'view-dashboard',
    'view-reports',
    'request-items',
    'request-repairs'
  ],
  'logistics-officer': [
    'view-dashboard',
    'manage-stock',
    'issue-items',
    'view-reports'
  ],
  'system-admin': [
    'view-dashboard',
    'manage-stock',
    'manage-users',
    'view-reports',
    'view-logs'
  ]
};

// Check if a role has a specific permission
export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  return rolePermissions[role]?.includes(permission) || false;
};

// Get all permissions for a role
export const getRolePermissions = (role: UserRole): Permission[] => {
  return rolePermissions[role] || [];
}; 