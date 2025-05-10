import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Menu, X, LogOut, ChevronDown, Package, ClipboardList, User, Settings } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNotificationsStore } from '../store/notificationsStore';
import { usePermissions } from '../hooks/usePermissions';
import Badge from './ui/Badge';
import NotificationsDropdown from './NotificationsDropdown';

const ORG_NAME_KEY = 'orgName';
const ORG_LOGO_KEY = 'orgLogo';

const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { getUnreadCount } = useNotificationsStore();
  const { checkPermission } = usePermissions();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const location = useLocation();
  
  if (!user) return null;
  
  const unreadCount = getUnreadCount(user.id);

  // Get org name and logo from localStorage
  const orgName = localStorage.getItem(ORG_NAME_KEY) || 'NPC Logistics';
  const orgLogo = localStorage.getItem(ORG_LOGO_KEY);

  // Navigation links based on user permissions
  const navigationLinks = () => {
    const links = [
      // System-admin-specific links in correct order
      ...(user.role === 'system-admin' ? [
        { name: 'Dashboard', path: '/', icon: <Package className="w-5 h-5" />, permission: 'view-dashboard' },
        { name: 'Stock Availability', path: '/stock-availability', icon: <Package className="w-5 h-5" />, permission: 'view-stock' },
        { name: 'Requests', path: '/requests', icon: <ClipboardList className="w-5 h-5" />, permission: 'approve-requests' },
        { name: 'Reports', path: '/reports', icon: <ClipboardList className="w-5 h-5" />, permission: 'view-reports' },
        { name: 'Users', path: '/users', icon: <User className="w-5 h-5" />, permission: 'manage-users' },
        { name: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5" />, permission: 'manage-users' },
      ] : []),
      // Admin-specific links
      ...(user.role === 'admin' ? [
        { name: 'Dashboard', path: '/', icon: <Package className="w-5 h-5" />, permission: 'view-dashboard' },
        { name: 'Stock Availability', path: '/admin/stock', icon: <Package className="w-5 h-5" />, permission: 'view-stock' },
        { name: 'Approve Requests', path: '/admin/approve-requests', icon: <ClipboardList className="w-5 h-5" />, permission: 'approve-requests' },
        { name: 'Reports', path: '/admin/reports', icon: <ClipboardList className="w-5 h-5" />, permission: 'view-reports' },
        { name: 'Requests', path: '/admin/requests', icon: <ClipboardList className="w-5 h-5" />, permission: 'approve-requests' },
      ] : []),
      // Logistics-officer-specific links
      ...(user.role === 'logistics-officer' ? [
        { name: 'Dashboard', path: '/', icon: <Package className="w-5 h-5" />, permission: 'view-dashboard' },
        { name: 'Stock Management', path: '/stock-management', icon: <Package className="w-5 h-5" />, permission: 'manage-stock' },
        { name: 'Issue Items', path: '/issue-items', icon: <ClipboardList className="w-5 h-5" />, permission: 'issue-items' },
        { name: 'Reports', path: '/reports', icon: <ClipboardList className="w-5 h-5" />, permission: 'view-reports' },
        { name: 'Approved Requests', path: '/approved-requests', icon: <ClipboardList className="w-5 h-5" />, permission: 'view-approved-requests' },
      ] : []),
      // Unit-leader-specific links
      ...(user.role === 'unit-leader' ? [
        { name: 'Dashboard', path: '/', icon: <Package className="w-5 h-5" />, permission: 'view-dashboard' },
        { name: 'My Requests', path: '/my-requests', icon: <ClipboardList className="w-5 h-5" />, permission: 'request-items' },
        { name: 'Items In-Use', path: '/items-in-use', icon: <Package className="w-5 h-5" />, permission: 'request-items' },
      ] : []),
      // Non-admin links (for any other roles)
      ...(user.role !== 'admin' && user.role !== 'system-admin' && user.role !== 'logistics-officer' && user.role !== 'unit-leader' ? [
        // Add other links for other roles here if needed
      ] : []),
    ];

    return links.filter(link =>
      (user.role === 'admin')
        ? link.path === '/' || link.path.startsWith('/admin/')
        : (user.role === 'system-admin' || user.role === 'logistics-officer' || user.role === 'unit-leader'
            ? true // Show all links in the block for these roles
            : checkPermission(link.permission)
          )
    );
  };

  const links = navigationLinks();

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center gap-2">
                {orgLogo ? (
                  <img src={orgLogo} alt="Logo" className="w-8 h-8 rounded" />
                ) : (
                  <Package className="w-8 h-8 text-blue-800" />
                )}
                <span className="font-bold text-xl text-slate-900">{orgName}</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 ${
                    location.pathname === link.path
                      ? 'border-blue-800 text-slate-900'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                className="p-1 rounded-full text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              >
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-600 text-white text-xs font-medium flex items-center justify-center transform -translate-y-1/4 translate-x-1/4">
                    {unreadCount}
                  </span>
                )}
              </button>
              {isNotificationsOpen && <NotificationsDropdown onClose={() => setIsNotificationsOpen(false)} />}
            </div>

            {/* Profile dropdown */}
            <div className="ml-3 relative">
              <div>
                <button
                  type="button"
                  className="flex items-center max-w-xs rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  id="user-menu-button"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-blue-800 flex items-center justify-center text-white">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-slate-700">{user.name}</span>
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </button>
              </div>

              {isProfileMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <div className="px-4 py-2 border-b border-slate-200">
                    <p className="text-sm font-medium text-slate-900">{user.name}</p>
                    <Badge variant="primary" className="mt-1 capitalize">
                      {user.role.replace('-', ' ')}
                    </Badge>
                  </div>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full text-left flex items-center px-4 py-2 text-sm text-red-700 hover:bg-slate-100"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="p-1 mr-2 rounded-full text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute top-4 right-11 block h-5 w-5 rounded-full bg-red-600 text-white text-xs font-medium flex items-center justify-center transform -translate-y-1/4 translate-x-1/4">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-white pt-2 pb-3 border-t border-slate-200">
          <div className="px-4 py-2 border-b border-slate-200">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-blue-800 flex items-center justify-center text-white">
                {user.name.charAt(0)}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-900">{user.name}</p>
              </div>
            </div>
            <Badge variant="primary" className="mt-2 capitalize">
              {user.role.replace('-', ' ')}
            </Badge>
          </div>
          <div className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center px-4 py-2 text-base font-medium ${
                  location.pathname === link.path
                    ? 'bg-blue-50 text-blue-800'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="mr-3">{link.icon}</span>
                {link.name}
              </Link>
            ))}
            <Link
              to="/profile"
              className="flex items-center px-4 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <User className="mr-3 h-5 w-5" />
              Profile
            </Link>
            <button
              onClick={() => {
                logout();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center px-4 py-2 text-base font-medium text-red-700 hover:bg-slate-50"
            >
              <LogOut className="mr-3 h-5 w-5" /> Sign out
            </button>
          </div>
        </div>
      )}
      
      {/* Notifications dropdown for mobile */}
      {isNotificationsOpen && <NotificationsDropdown onClose={() => setIsNotificationsOpen(false)} isMobile={true} />}
    </nav>
  );
};

export default Navbar;