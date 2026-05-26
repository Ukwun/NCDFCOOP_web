'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Heart, ShoppingCart } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '@/lib/auth/authContext';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS, USER_ROLES } from '@/lib/constants/database';
import RoleIntentSearch from '@/components/RoleIntentSearch';
import { useFavorites } from '@/lib/hooks';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  matchPrefixes?: string[];
  exactMatch?: boolean;
}

interface RoleNavMode {
  modeLabel: string;
  modeDescriptor: string;
  accentClasses: {
    chip: string;
    active: string;
    modeBar: string;
  };
  items: NavItem[];
}

const ROLE_NAVIGATION_MODES: Record<string, RoleNavMode> = {
  [USER_ROLES.MEMBER]: {
    modeLabel: 'Member Mode',
    modeDescriptor: 'Simple. Behavioral. Consumer-first.',
    accentClasses: {
      chip: 'bg-[#EAF4FB] text-[#0E4B78] dark:bg-[#0D3D63]/30 dark:text-[#7FC2EA]',
      active: 'text-[#0E4B78] dark:text-[#7FC2EA] bg-[#EAF4FB] dark:bg-[#0D3D63]/30',
      modeBar: 'bg-gradient-to-r from-[#0D3D63] via-[#0E527F] to-[#1576A9]',
    },
    items: [
      { id: 'home', label: 'Home', icon: '🏠', href: '/home', exactMatch: true },
      {
        id: 'investments',
        label: 'Investments',
        icon: '📈',
        href: '/member/investments',
        matchPrefixes: ['/member/investments', '/member-benefits', '/member-products', '/my-rewards', '/member-voting', '/member-transparency'],
      },
    ],
  },
  [USER_ROLES.INSTITUTIONAL_BUYER]: {
    modeLabel: 'Wholesale Mode',
    modeDescriptor: 'Data-heavy. Operational. Institutional.',
    accentClasses: {
      chip: 'bg-[#E8F6EE] text-[#164A2E] dark:bg-[#164A2E]/30 dark:text-[#8FD8AE]',
      active: 'text-[#164A2E] dark:text-[#8FD8AE] bg-[#E8F6EE] dark:bg-[#164A2E]/30',
      modeBar: 'bg-gradient-to-r from-[#164A2E] via-[#1E7F4E] to-[#2A9B61]',
    },
    items: [
      { id: 'overview', label: 'Overview', icon: '🧭', href: '/home', exactMatch: true },
      {
        id: 'portfolio',
        label: 'Portfolio',
        icon: '📂',
        href: '/wholesale/portfolio',
        matchPrefixes: ['/wholesale/portfolio'],
      },
      {
        id: 'bulk-investments',
        label: 'Bulk Investments',
        icon: '🏗️',
        href: '/wholesale/bulk-investments',
        matchPrefixes: ['/wholesale/bulk-investments', '/wholesale/orders'],
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: '📊',
        href: '/wholesale/analytics',
        matchPrefixes: ['/wholesale/analytics'],
      },
      {
        id: 'compliance',
        label: 'Compliance',
        icon: '🛡️',
        href: '/wholesale/compliance',
        matchPrefixes: ['/wholesale/compliance', '/settings'],
      },
      {
        id: 'profile',
        label: 'Profile',
        icon: '👤',
        href: '/wholesale/profile',
        matchPrefixes: ['/wholesale/profile'],
      },
    ],
  },
  [USER_ROLES.SELLER]: {
    modeLabel: 'Seller Mode',
    modeDescriptor: 'Sales-oriented. Relationship-driven.',
    accentClasses: {
      chip: 'bg-[#EAF6EF] text-[#0B6B3A] dark:bg-[#0B6B3A]/30 dark:text-[#7FD4A9]',
      active: 'text-[#0B6B3A] dark:text-[#7FD4A9] bg-[#EAF6EF] dark:bg-[#0B6B3A]/30',
      modeBar: 'bg-gradient-to-r from-[#095234] via-[#0B6B3A] to-[#159A54]',
    },
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: '🏪',
        href: '/seller',
        exactMatch: true,
      },
      {
        id: 'clients',
        label: 'Clients',
        icon: '🤝',
        href: '/seller/clients',
        matchPrefixes: ['/seller/clients'],
      },
      {
        id: 'products',
        label: 'Products',
        icon: '📦',
        href: '/seller/products',
        matchPrefixes: ['/seller/products', '/seller/product-upload'],
      },
      {
        id: 'earnings',
        label: 'Earnings',
        icon: '💰',
        href: '/seller/earnings',
        matchPrefixes: ['/seller/earnings'],
      },
      { id: 'profile', label: 'Profile', icon: '👤', href: '/account' },
    ],
  },
};

function normalizeRole(role: string | null | undefined): string {
  if (!role) return USER_ROLES.MEMBER;
  if (role === 'wholesale_buyer') return USER_ROLES.INSTITUTIONAL_BUYER;
  return role;
}

function formatRoleLabel(role: string): string {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === USER_ROLES.INSTITUTIONAL_BUYER) {
    return 'Wholesale Buyer';
  }

  return normalizedRole
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function isRouteActive(pathname: string, item: NavItem): boolean {
  if (item.exactMatch) {
    return pathname === item.href;
  }
  if (pathname === item.href) return true;
  if (item.matchPrefixes?.some((prefix) => pathname.startsWith(prefix))) return true;
  if (item.href !== '/home' && pathname.startsWith(`${item.href}/`)) return true;
  return false;
}

export default function EnhancedNavigation() {
  const { user, loading, logout, currentRole, switchRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const { count: favoritesCount } = useFavorites({ userId: user?.uid || '', autoFetch: !!user?.uid });

  useEffect(() => {
    if (!user?.uid || !db) {
      setCartCount(0);
      return;
    }

    const cartQuery = query(
      collection(db, COLLECTIONS.CART_ITEMS),
      where('userId', '==', user.uid)
    );

    const unsubscribeCart = onSnapshot(
      cartQuery,
      (snapshot) => {
        setCartCount(snapshot.size);
      },
      () => {
        setCartCount(0);
      }
    );

    return () => {
      unsubscribeCart();
    };
  }, [user?.uid]);

  // Hide navigation on splash, welcome, all auth, onboarding, and role-selection pages
  const shouldHideNav = pathname
    ? (
        pathname === '/splash' ||
        pathname === '/welcome' ||
        pathname === '/auth' ||
        pathname.startsWith('/auth') ||
        pathname === '/signin' ||
        pathname === '/signup' ||
        pathname.startsWith('/onboarding') ||
        pathname === '/role-selection' ||
        pathname.startsWith('/wholesale/profile') ||
        pathname.startsWith('/seller/onboarding')
      )
    : false;

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

  const normalizedRole = normalizeRole(currentRole);
  const navMode = ROLE_NAVIGATION_MODES[normalizedRole] || ROLE_NAVIGATION_MODES[USER_ROLES.MEMBER];
  const navigationItems = navMode.items;
  const hasMultipleRoles = !!user?.roles && user.roles.length > 1;

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <Link href="/home" className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white hover:text-blue-600 transition-colors">
              <img src="/images/logo/NCDFCOOPLOGO.png" alt="NCDFCOOP Logo" className="h-8 w-auto" style={{ maxHeight: '2rem' }} />
            </Link>

            {/* Center Navigation - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-6">
              {navigationItems.map((item) => {
                const isActive = pathname ? isRouteActive(pathname, item) : false;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/favorites"
                className="relative p-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Favorites"
                aria-label="Open favorites"
              >
                <Heart size={18} />
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold flex items-center justify-center">
                    {favoritesCount > 99 ? '99+' : favoritesCount}
                  </span>
                )}
              </Link>

              <Link
                href="/cart"
                className="relative p-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Cart"
                aria-label="Open cart"
              >
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-semibold flex items-center justify-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              {/* Role Indicator */}
              {user?.roles && user.roles.length > 1 && (
                <div className="hidden sm:block relative">
                  <button
                    onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                    className={`relative px-3 py-1 text-xs font-semibold rounded-full transition-colors ${navMode.accentClasses.chip}`}
                  >
                    {navMode.modeLabel}
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
                              ? navMode.accentClasses.active
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {formatRoleLabel(role)}
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

        <div className="border-t border-gray-100 dark:border-gray-700/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <RoleIntentSearch currentRole={normalizedRole} />
          </div>
        </div>

        <div className={`${navMode.accentClasses.modeBar} text-white border-t border-white/10`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.24em] opacity-75">NCDF Primary Navigation</p>
              <p className="text-sm font-semibold">{navMode.modeLabel}</p>
            </div>
            <p className="text-xs sm:text-sm opacity-90">{navMode.modeDescriptor}</p>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden z-40">
        {hasMultipleRoles && (
          <div className="border-b border-gray-200 dark:border-gray-700 px-3 py-2">
            <button
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className={`w-full px-3 py-2 text-xs font-semibold rounded-full transition-colors ${navMode.accentClasses.chip}`}
            >
              {navMode.modeLabel}
            </button>

            {showRoleSwitcher && (
              <div className="mt-2 rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 py-2">
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
                        ? navMode.accentClasses.active
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {formatRoleLabel(role)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-start overflow-x-auto">
          <Link
            href="/favorites"
            className="flex-1 flex flex-col items-center justify-center py-2 px-1 min-h-14 transition-colors text-gray-600 dark:text-gray-400"
            style={{ minWidth: `${100 / (navigationItems.length + 2)}%` }}
            aria-label="Open favorites"
          >
            <span className="relative">
              <Heart size={18} />
              {favoritesCount > 0 && (
                <span className="absolute -top-2 -right-3 min-w-[16px] h-[16px] px-1 rounded-full bg-red-600 text-white text-[9px] font-semibold flex items-center justify-center">
                  {favoritesCount > 99 ? '99+' : favoritesCount}
                </span>
              )}
            </span>
            <span className="text-xs font-medium mt-1 text-center">Favorites</span>
          </Link>

          <Link
            href="/cart"
            className="flex-1 flex flex-col items-center justify-center py-2 px-1 min-h-14 transition-colors text-gray-600 dark:text-gray-400"
            style={{ minWidth: `${100 / (navigationItems.length + 2)}%` }}
            aria-label="Open cart"
          >
            <span className="relative">
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-3 min-w-[16px] h-[16px] px-1 rounded-full bg-blue-600 text-white text-[9px] font-semibold flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </span>
            <span className="text-xs font-medium mt-1 text-center">Cart</span>
          </Link>

          {navigationItems.map((item) => {
            const isActive = pathname ? isRouteActive(pathname, item) : false;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 min-h-14 transition-colors ${
                  isActive
                    ? navMode.accentClasses.active
                    : 'text-gray-600 dark:text-gray-400'
                }`}
                style={{ minWidth: `${100 / (navigationItems.length + 2)}%` }}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-medium mt-1 text-center">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Spacer */}
      <div className="h-16 md:hidden"></div>
    </>
  );
}
