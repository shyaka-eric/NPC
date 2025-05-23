import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Menu, X, LogOut, ChevronDown } from 'lucide-react'; // Removed unused imports
import { useAuthStore } from '../store/authStore';
import { useNotificationsStore } from '../store/notificationsStore';
import Badge from './ui/Badge';
import NotificationsDropdown from './NotificationsDropdown';

const ORG_NAME_KEY = 'orgName';
const ORG_LOGO_KEY = 'orgLogo';

const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  if (!user) return null; // Ensure user is not null before rendering
  
  const unreadCount = useNotificationsStore((state) => state.unreadCount); // Subscribe to unreadCount changes

  // Get org name and logo from localStorage
  const orgName = localStorage.getItem(ORG_NAME_KEY) || 'NPC Logistics';
  const orgLogo = localStorage.getItem(ORG_LOGO_KEY);

  const navigationLinks = [
    { name: 'Dashboard', path: '/', roles: ['system-admin', 'admin', 'logistics-officer', 'unit-leader'] },
    { name: 'Stock Availability', path: '/stock-availability', roles: ['system-admin'] },
    { name: 'Requests', path: '/requests', roles: ['system-admin'] },
    { name: 'Report', path: '/reports', roles: ['system-admin'] },
    { name: 'My Requests', path: '/my-requests', roles: ['unit-leader'] },
    { name: 'My Repair Requests', path: '/my-repair-requests', roles: ['unit-leader'] },
    { name: 'In-Use Items', path: '/items-in-use', roles: ['unit-leader'] },
    { name: 'Stock Management', path: '/stock-management', roles: ['logistics-officer'] },
    { name: 'Approved Requests', path: '/approved-requests', roles: ['logistics-officer'] },
    { name: 'Issue Item', path: '/issue-items', roles: ['logistics-officer'] },
    { name: 'Users', path: '/users', roles: ['system-admin'] },
    { name: 'Settings', path: '/settings', roles: ['system-admin'] },
    { name: 'Logs', path: '/logs', roles: ['system-admin'] },
    { name: 'Stock Availability', path: '/admin/stock', roles: ['admin'] },
    { name: 'Item Request', path: '/admin/requests', roles: ['admin'] },
    { name: 'Reports', path: '/admin/reports', roles: ['admin'] },
    { name: 'Repair Request', path: '/repair-items', roles: ['admin', 'system-admin'] },
    { name: 'Damaged Items', path: '/damaged-items', roles: ['logistics-officer'] },
    { name: 'Repair In Process', path: '/repair-in-process', roles: ['logistics-officer'] },
  ].filter(link => link.roles.includes(user.role));

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
                  <span className="w-8 h-8 text-blue-800">{orgName.charAt(0)}</span>
                )}
                <span className="font-bold text-xl text-slate-900">{orgName}</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <div className="flex items-center gap-8"> {/* Adjusted alignment of navigation options */}
                {navigationLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className="text-slate-700 hover:text-blue-800 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    <span className="ml-2">{link.name}</span>
                  </Link>
                ))}
              </div>
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
              {/* Only render one NotificationsDropdown at a time, responsive */}
              {isNotificationsOpen && (
                <div>
                  <div className="hidden sm:block">
                    <NotificationsDropdown onClose={() => setIsNotificationsOpen(false)} />
                  </div>
                  <div className="block sm:hidden">
                    <NotificationsDropdown onClose={() => setIsNotificationsOpen(false)} />
                  </div>
                </div>
              )}
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
            {navigationLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="flex items-center px-4 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="ml-2">{link.name}</span>
              </Link>
            ))}
            <Link
              to="/profile"
              className="flex items-center px-4 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              onClick={() => setIsMobileMenuOpen(false)}
            >
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
    </nav>
  );
};

export default Navbar;