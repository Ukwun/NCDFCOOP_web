'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { USER_ROLES } from '@/lib/constants/database';

export default function EnhancedNavigation() {
  const { user, loading, logout, currentRole, switchRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  // Hide navigation on splash, welcome, auth, and onboarding pages
  const hiddenPaths = ['/splash', '/welcome', '/auth/', '/onboarding', '/role-selection', '/seller/onboarding'];
  const shouldHideNav = hiddenPaths.some(path => pathname.startsWith(path));

  if (loading || !user || shouldHideNav) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/welcome');
      setShowLogoutDialog(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Role-specific navigation items
  const getNavigationItems = () => {
    const baseItems = [
      { id: 'home', label: 'Home', icon: '🏠', href: '/home' },
    ];

    const roleSpecificItems: Record<string, any[]> = {
      [USER_ROLES.MEMBER]: [
        { id: 'offers', label: 'Offers', icon: '🎁', href: '/offers' },
        { id: 'cart', label: 'Cart', icon: '🛒', href: '/cart' },
      ],
      [USER_ROLES.WHOLESALE_BUYER]: [
        { id: 'catalog', label: 'Catalog', icon: '📦', href: '/catalog' },
        { id: 'orders', label: 'Orders', icon: '📋', href: '/orders' },
      ],
      [USER_ROLES.SELLER]: [
        { id: 'products', label: 'Products', icon: '🏪', href: '/seller/products' },
        { id: 'orders', label: 'Orders', icon: '📦', href: '/seller/orders' },
      ],
    };

    const roleItems = roleSpecificItems[currentRole || USER_ROLES.MEMBER] || [];
    
    return [
      ...baseItems,
      ...roleItems,
      { id: 'account', label: 'Account', icon: '👤', href: '/account' },
    ];
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <Link href="/home" className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white hover:text-blue-600 transition-colors">
              🛍️ NCDFCOOP
            </Link>

            {/* Center Navigation - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-6">
              {navigationItems.map((item) => (
                item.id !== 'account' && (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                      pathname === item.href
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Role Indicator */}
              {user?.roles && user.roles.length > 1 && (
                <div className="hidden sm:block">
                  <button
                    onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                    className="relative px-3 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    {currentRole?.charAt(0).toUpperCase()}{currentRole?.slice(1)}
                  </button>

                  {/* Role Switcher Dropdown */}
                  {showRoleSwitcher && (
                    <div className="absolute right-20 top-16 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-max z-50">
                      {user.roles.map((role) => (
                        <button
                          key={role}
                          onClick={async () => {
                            await switchRole(role);
                            setShowRoleSwitcher(false);
                            router.push('/home');
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            currentRole === role
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {role.charAt(0).toUpperCase()}{role.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Account Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowLogoutDialog(!showLogoutDialog)}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title={user?.displayName || 'Account'}
                >
                  <span>👤</span>
                  <span className="hidden sm:inline text-sm font-medium truncate max-w-xs">
                    {user?.displayName || 'Account'}
                  </span>
                </button>

                {showLogoutDialog && (
                  <div className="absolute right-0 top-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-max z-50">
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      View Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden z-40">
        <div className="flex justify-around">
          {navigationItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 min-h-14 transition-colors ${
                pathname === item.href
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium mt-1 text-center">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Spacer */}
      <div className="h-16 md:hidden"></div>
    </>
  );
}
