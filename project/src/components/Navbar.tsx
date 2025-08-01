import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Menu, X, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNotificationsStore } from '../store/notificationsStore';
import Badge from './ui/Badge';
import NotificationsDropdown from './NotificationsDropdown';
import npcLogo from '../images/npclogo.jpeg';

const ORG_NAME_KEY = 'orgName';

const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const location = useLocation();
  
  if (!user) return null;
  
  const unreadCount = useNotificationsStore((state) => state.unreadCount);

  // Get org name from localStorage
  const orgName = localStorage.getItem(ORG_NAME_KEY) || 'NPC Logistics';

  const navigationLinks = [
    { name: 'Dashboard', path: '/', roles: ['system-admin', 'admin', 'logistics-officer', 'unit-leader'] },
    // { name: 'Users', path: '/users', roles: ['system-admin'] }, // Removed Users link for system-admin
    { name: 'Stock Availability', path: '/stock-availability', roles: ['admin'] },
  ].filter(link => link.roles.includes(user.role));

  const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim();

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <img src={npcLogo} alt="Logo" className="w-8 h-8 rounded object-contain bg-white" />
                <span className="font-bold text-xl text-slate-900">{orgName}</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <div className="flex items-center gap-8">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium ml-2 ${location.pathname === link.path ? 'bg-blue-100 text-blue-800 font-semibold' : 'text-slate-700 hover:text-blue-800'}`}
                  >
                    {link.name}
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
                    <div className="h-8 w-8 rounded-full bg-blue-800 flex items-center justify-center text-white overflow-hidden">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage.startsWith('http')
                            ? user.profileImage
                            : user.profileImage.startsWith('/media/')
                              ? `http://localhost:8000${user.profileImage}`
                              : user.profileImage.includes('/')
                                ? `http://localhost:8000/${user.profileImage.replace(/^\/+/,'')}`
                                : `http://localhost:8000/media/${user.profileImage}`}
                          alt="Profile"
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        userName.charAt(0)
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-slate-700">{userName}</span>
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </button>
              </div>

              {isProfileMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <div className="px-4 py-2 border-b border-slate-200">
                    <p className="text-sm font-medium text-slate-900">{userName}</p>
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
                  {user.role === 'system-admin' && (
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Settings
                    </Link>
                  )}
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
              <div className="h-8 w-8 rounded-full bg-blue-800 flex items-center justify-center text-white overflow-hidden">
                {user.profileImage ? (
                  <img
                    src={user.profileImage.startsWith('http')
                      ? user.profileImage
                      : user.profileImage.startsWith('/media/')
                        ? `http://localhost:8000${user.profileImage}`
                        : user.profileImage.includes('/')
                          ? `http://localhost:8000/${user.profileImage.replace(/^\/+/,'')}`
                          : `http://localhost:8000/media/${user.profileImage}`}
                    alt="Profile"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  userName.charAt(0)
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-900">{userName}</p>
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
                className={`flex items-center px-4 py-2 text-base font-medium ml-2 ${location.pathname === link.path ? 'bg-blue-100 text-blue-800 font-semibold' : 'text-slate-700 hover:bg-slate-900 hover:bg-slate-50'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
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