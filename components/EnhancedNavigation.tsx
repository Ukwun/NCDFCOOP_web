'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BadgeDollarSign, BadgePercent, BarChart3, Boxes, BriefcaseBusiness, Building2, ChevronDown, ClipboardList, Heart, Home, Landmark, LayoutDashboard, LogOut, MessageCircle, PackageSearch, ShieldCheck, ShoppingCart, Timer, UserRound, Users, type LucideIcon } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '@/lib/auth/authContext';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS, USER_ROLES } from '@/lib/constants/database';
import { useFavorites } from '@/lib/hooks';
import { getCartItemCount, CART_CHANGED_EVENT } from '@/lib/services/cartService';
import { getRoleLandingPath } from '@/lib/auth/roleRouting';

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

const NAV_ICONS: Record<string, LucideIcon> = {
  home: Home,
  marketplace: PackageSearch,
  investments: BarChart3,
  overview: LayoutDashboard,
  catalog: PackageSearch,
  orders: ClipboardList,
  suppliers: Building2,
  sla: Timer,
  compliance: ShieldCheck,
  dashboard: LayoutDashboard,
  clients: Users,
  'wholesale-orders': BriefcaseBusiness,
  products: Boxes,
  earnings: BadgeDollarSign,
  offers: BadgePercent,
  payouts: Landmark,
  messages: MessageCircle,
  admin: ShieldCheck,
  operations: BriefcaseBusiness,
  analytics: BarChart3,
};

function RoleNavIcon({ id, size = 17 }: { id: string; size?: number }) {
  const Icon = NAV_ICONS[id] || LayoutDashboard;
  return <Icon size={size} aria-hidden="true" />;
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
      { id: 'home', label: 'Home', icon: 'Ã°Å¸ÂÂ ', href: '/home', exactMatch: true },
      {
        id: 'marketplace',
        label: 'Marketplace',
        icon: 'Marketplace',
        href: '/member-products',
        matchPrefixes: ['/member-products', '/products', '/cart', '/checkout', '/favorites'],
      },
      {
        id: 'investments',
        label: 'Investments',
        icon: 'Ã°Å¸â€œË†',
        href: '/member/investments',
        matchPrefixes: ['/member/investments', '/member-benefits', '/my-rewards', '/member-voting', '/member-transparency'],
      },
      { id: 'messages', label: 'Messages', icon: 'Messages', href: '/messages', matchPrefixes: ['/messages'] },
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
      { id: 'overview', label: 'Overview', icon: 'Ã°Å¸Â§Â­', href: '/home', exactMatch: true },
      {
        id: 'catalog',
        label: 'Bulk Catalog',
        icon: 'Catalog',
        href: '/wholesale/products',
        matchPrefixes: ['/wholesale/products', '/products/'],
      },
      {
        id: 'orders',
        label: 'Orders',
        icon: 'Orders',
        href: '/wholesale/orders',
        matchPrefixes: ['/wholesale/orders', '/orders/'],
      },
      {
        id: 'suppliers',
        label: 'Suppliers',
        icon: 'Supply',
        href: '/wholesale/suppliers',
        matchPrefixes: ['/wholesale/suppliers'],
      },
      {
        id: 'sla',
        label: 'SLA Monitor',
        icon: 'SLA',
        href: '/wholesale/sla-monitoring',
        matchPrefixes: ['/wholesale/sla-monitoring', '/wholesale/analytics'],
      },
      {
        id: 'compliance',
        label: 'Compliance',
        icon: 'Ã°Å¸â€ºÂ¡Ã¯Â¸Â',
        href: '/wholesale/compliance',
        matchPrefixes: ['/wholesale/compliance', '/wholesale/settings'],
      },
      { id: 'messages', label: 'Messages', icon: 'Messages', href: '/messages', matchPrefixes: ['/messages'] },
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
        icon: 'Ã°Å¸ÂÂª',
        href: '/seller',
        exactMatch: true,
      },
      {
        id: 'clients',
        label: 'Clients',
        icon: 'Ã°Å¸Â¤Â',
        href: '/seller/clients',
        matchPrefixes: ['/seller/clients'],
      },
      {
        id: 'wholesale-orders',
        label: 'Bulk Orders',
        icon: 'B2B',
        href: '/seller/wholesale-orders',
        matchPrefixes: ['/seller/wholesale-orders'],
      },
      {
        id: 'products',
        label: 'Products',
        icon: 'Ã°Å¸â€œÂ¦',
        href: '/seller/products',
        matchPrefixes: ['/seller/products', '/seller/products/add'],
      },
      {
        id: 'earnings',
        label: 'Earnings',
        icon: 'Ã°Å¸â€™Â°',
        href: '/seller/earnings',
        matchPrefixes: ['/seller/earnings'],
      },
      {
        id: 'withdrawals',
        label: 'Withdraw Funds',
        icon: 'Payouts',
        href: '/seller/withdrawals',
        matchPrefixes: ['/seller/withdrawals'],
      },
      {
        id: 'offers',
        label: 'Offers',
        icon: 'Offers',
        href: '/seller/offers',
        matchPrefixes: ['/seller/offers'],
      },
      {
        id: 'payouts',
        label: 'Bank Accounts',
        icon: 'Payouts',
        href: '/seller/payout-profile',
        matchPrefixes: ['/seller/payout-profile'],
      },
      { id: 'messages', label: 'Messages', icon: 'Messages', href: '/messages', matchPrefixes: ['/messages'] },
    ],
  },
};

const OPERATIONAL_NAVIGATION_MODE: RoleNavMode = {
  modeLabel: 'Operations Mode',
  modeDescriptor: 'Permission-scoped platform operations.',
  accentClasses: {
    chip: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
    active: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
    modeBar: 'bg-gradient-to-r from-violet-950 via-violet-800 to-indigo-700',
  },
  items: [
    { id: 'admin', label: 'Admin', icon: 'Admin', href: '/admin', exactMatch: true },
    { id: 'operations', label: 'Approvals & Operations', icon: 'Operations', href: '/admin/operations', matchPrefixes: ['/admin/operations'] },
    { id: 'analytics', label: 'Analytics', icon: 'Analytics', href: '/analytics', matchPrefixes: ['/analytics'] },
  ],
};

const OPERATIONAL_ROLES: ReadonlySet<string> = new Set([
  USER_ROLES.ADMIN,
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.STAFF,
  USER_ROLES.OPERATOR,
  USER_ROLES.SUPPORT_AGENT,
  USER_ROLES.DISPUTE_OFFICER,
  USER_ROLES.FINANCE_OPERATOR,
  USER_ROLES.RISK_OFFICER,
]);

function formatRoleLabel(role: string): string {
  if (role === USER_ROLES.INSTITUTIONAL_BUYER) {
    return 'Wholesale Buyer';
  }

  return role
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
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const roleSwitcherRef = useRef<HTMLDivElement | null>(null);
  const roleSwitcherButtonRef = useRef<HTMLButtonElement | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const accountButtonRef = useRef<HTMLButtonElement | null>(null);
  const { count: favoritesCount } = useFavorites({ userId: user?.uid || '', autoFetch: !!user?.uid });

  useEffect(() => {
    if (!user?.uid) {
      setCartCount(0);
      return;
    }

    let active = true;

    const refreshCartCount = async () => {
      try {
        const count = await getCartItemCount(user.uid);
        if (active) {
          setCartCount(count);
        }
      } catch {
        if (active) {
          setCartCount(0);
        }
      }
    };

    refreshCartCount();

    const handleCartChanged = () => {
      refreshCartCount();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(CART_CHANGED_EVENT, handleCartChanged);
    }

    if (!db) {
      return () => {
        active = false;
        if (typeof window !== 'undefined') {
          window.removeEventListener(CART_CHANGED_EVENT, handleCartChanged);
        }
      };
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
        refreshCartCount();
      }
    );

    return () => {
      active = false;
      unsubscribeCart();
      if (typeof window !== 'undefined') {
        window.removeEventListener(CART_CHANGED_EVENT, handleCartChanged);
      }
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !db) {
      setUnreadMessageCount(0);
      return;
    }
    const conversationQuery = query(
      collection(db, COLLECTIONS.CONVERSATIONS),
      where('participants', 'array-contains', user.uid),
    );
    return onSnapshot(
      conversationQuery,
      (snapshot) => {
        const total = snapshot.docs.reduce((sum, item) => {
          const counts = item.data().unreadCounts as Record<string, unknown> | undefined;
          return sum + Math.max(0, Number(counts?.[user.uid] || 0));
        }, 0);
        setUnreadMessageCount(total);
      },
      () => setUnreadMessageCount(0),
    );
  }, [user?.uid]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (showRoleSwitcher) {
        const clickedOutsideRole =
          roleSwitcherRef.current &&
          !roleSwitcherRef.current.contains(target) &&
          !roleSwitcherButtonRef.current?.contains(target);

        if (clickedOutsideRole) {
          setShowRoleSwitcher(false);
        }
      }

      if (showLogoutDialog) {
        const clickedOutsideAccount =
          accountMenuRef.current &&
          !accountMenuRef.current.contains(target) &&
          !accountButtonRef.current?.contains(target);

        if (clickedOutsideAccount) {
          setShowLogoutDialog(false);
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowRoleSwitcher(false);
        setShowLogoutDialog(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showRoleSwitcher, showLogoutDialog]);

  useEffect(() => {
    setShowRoleSwitcher(false);
    setShowLogoutDialog(false);
  }, [pathname]);

  // Hide navigation on splash, welcome, all auth, onboarding, and role-selection pages
  const shouldHideNav = pathname
    ? (
        pathname === '/splash' ||
        pathname === '/welcome' ||
        pathname.startsWith('/auth') ||
        pathname === '/signin' ||
        pathname === '/signup' ||
        pathname.startsWith('/onboarding') ||
        pathname === '/role-selection' ||
        pathname.startsWith('/seller/onboarding')
      )
    : false;

  if (loading || !user || shouldHideNav) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/signin');
      setShowLogoutDialog(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const normalizedRole = currentRole || USER_ROLES.MEMBER;
  const navMode = ROLE_NAVIGATION_MODES[normalizedRole]
    || (OPERATIONAL_ROLES.has(normalizedRole) ? OPERATIONAL_NAVIGATION_MODE : ROLE_NAVIGATION_MODES[USER_ROLES.MEMBER]);
  const navigationItems = OPERATIONAL_ROLES.has(normalizedRole)
    ? normalizedRole === USER_ROLES.ADMIN || normalizedRole === USER_ROLES.SUPER_ADMIN
      ? navMode.items
      : normalizedRole === USER_ROLES.STAFF || normalizedRole === USER_ROLES.OPERATOR
        ? navMode.items.filter((item) => item.id === 'analytics')
        : navMode.items.filter((item) => item.id === 'operations')
    : navMode.items;
  const desktopNavigationItems =
    normalizedRole === USER_ROLES.SELLER
      ? navigationItems.filter((item) => item.id !== 'messages')
      : navigationItems;
  const hasMultipleRoles = !!user?.roles && user.roles.length > 1;
  const isBuyerRole = normalizedRole === USER_ROLES.MEMBER || normalizedRole === USER_ROLES.INSTITUTIONAL_BUYER;
  const mobileItemCount = navigationItems.length + (isBuyerRole ? 2 : 0);
  const accountName = user.displayName?.trim() || user.email?.split('@')[0] || formatRoleLabel(normalizedRole);

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-xl dark:border-gray-700 dark:bg-gray-800/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            {/* Logo/Brand */}
            <Link href={getRoleLandingPath(normalizedRole)} className="group relative block h-12 w-32 shrink-0 overflow-hidden rounded-lg sm:w-40" aria-label="NCDFCOOP home">
              <span
                role="img"
                aria-label="NCDFCOOP Logo"
                className="absolute inset-0 bg-white bg-no-repeat transition-transform duration-300 group-hover:scale-[1.03]"
                style={{
                  backgroundImage: "url('/images/logo/NCDFCOOPLOGO.png')",
                  backgroundPosition: 'center 47%',
                  backgroundSize: 'cover',
                }}
              />
            </Link>

            {/* Center Navigation - Hidden on mobile */}
            <div className="hidden items-center gap-1 lg:flex">
              {desktopNavigationItems.map((item) => {
                const isActive = pathname ? isRouteActive(pathname, item) : false;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 transition-all duration-200 ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <RoleNavIcon id={item.id} />
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.id === 'messages' && unreadMessageCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white">
                        {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right Actions */}
            <div className="flex min-w-0 items-center gap-1 sm:gap-2">
              {isBuyerRole && (
                <>
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
                    href={normalizedRole === USER_ROLES.INSTITUTIONAL_BUYER && cartCount > 0 ? '/checkout' : '/cart'}
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
                </>
              )}

              {/* Role Indicator */}
              {user?.roles && user.roles.length > 1 && (
                <div className="hidden sm:block relative" ref={roleSwitcherRef}>
                  <button
                    ref={roleSwitcherButtonRef}
                    data-testid="nav-role-switcher-button"
                    onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                    className={`relative px-3 py-1 text-xs font-semibold rounded-full transition duration-200 ease-out transform hover:-translate-y-[1px] ${navMode.accentClasses.chip}`}
                    aria-haspopup="true"
                    aria-expanded={showRoleSwitcher}
                  >
                    {navMode.modeLabel}
                  </button>

                  {/* Role Switcher Dropdown */}
                  {showRoleSwitcher && (
                    <div
                      className="absolute right-0 top-10 z-50 min-w-max origin-top-right rounded-lg border border-gray-200 bg-white py-2 shadow-lg transition duration-200 ease-out dark:border-gray-700 dark:bg-gray-800"
                    >
                      {user.roles.map((role) => (
                        <button
                          key={role}
                          onClick={async () => {
                            await switchRole(role);
                            setShowRoleSwitcher(false);
                            router.push(getRoleLandingPath(role));
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
              <div className="relative flex min-w-0 items-center" ref={accountMenuRef}>
                <Link
                  href="/account"
                  data-testid="nav-account-button"
                  className="group flex min-w-0 items-center gap-2 rounded-l-xl border border-transparent px-2 py-1.5 text-gray-700 transition duration-200 ease-out hover:-translate-y-[1px] hover:border-gray-200 hover:bg-gray-100 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-700"
                  title={`View ${accountName}'s profile`}
                  aria-label={`View profile for ${accountName}`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-sm ring-2 ring-emerald-100 dark:ring-emerald-900/50">
                    <UserRound size={17} strokeWidth={2.25} aria-hidden="true" />
                  </span>
                  <span className="hidden max-w-[150px] truncate text-left text-sm font-semibold sm:block">{accountName}</span>
                </Link>
                <button
                  ref={accountButtonRef}
                  data-testid="nav-account-menu-button"
                  onClick={() => setShowLogoutDialog(!showLogoutDialog)}
                  className="flex h-11 w-7 shrink-0 items-center justify-center rounded-r-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                  title="Open account menu"
                  aria-haspopup="true"
                  aria-expanded={showLogoutDialog}
                  aria-label={`Open account menu for ${accountName}`}
                >
                  <ChevronDown size={14} className={`shrink-0 transition-transform ${showLogoutDialog ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>

                {showLogoutDialog && (
                  <div className="absolute right-0 top-12 z-50 w-64 origin-top-right rounded-xl border border-gray-200 bg-white py-2 shadow-xl transition duration-200 ease-out dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-100 px-4 pb-3 pt-1 dark:border-gray-700">
                      <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{accountName}</p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      <p className="mt-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">{formatRoleLabel(normalizedRole)}</p>
                    </div>
                    <Link
                      href="/account"
                      data-testid="nav-account-view-profile"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <UserRound size={16} aria-hidden="true" />
                      View Profile
                    </Link>
                    <button
                      data-testid="nav-account-logout"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <LogOut size={16} aria-hidden="true" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </nav>

      <div className="h-14" aria-hidden="true" />

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-gray-700 dark:bg-gray-800 lg:hidden">
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
                      router.push(getRoleLandingPath(role));
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
          {isBuyerRole && (
            <>
              <Link
                href="/favorites"
                className="flex min-h-14 flex-1 flex-col items-center justify-center px-1 py-2 text-gray-600 transition-colors dark:text-gray-400"
                style={{ minWidth: `max(4.5rem, ${100 / mobileItemCount}%)` }}
                aria-label="Open favorites"
                aria-current={pathname === '/favorites' ? 'page' : undefined}
              >
                <span className="relative">
                  <Heart size={18} />
                  {favoritesCount > 0 && (
                    <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-semibold text-white">
                      {favoritesCount > 99 ? '99+' : favoritesCount}
                    </span>
                  )}
                </span>
                <span className="mt-1 text-center text-xs font-medium">Favorites</span>
              </Link>

              <Link
                href={normalizedRole === USER_ROLES.INSTITUTIONAL_BUYER && cartCount > 0 ? '/checkout' : '/cart'}
                className="flex min-h-14 flex-1 flex-col items-center justify-center px-1 py-2 text-gray-600 transition-colors dark:text-gray-400"
                style={{ minWidth: `max(4.5rem, ${100 / mobileItemCount}%)` }}
                aria-label="Open cart"
                aria-current={pathname === '/cart' || pathname === '/checkout' ? 'page' : undefined}
              >
                <span className="relative">
                  <ShoppingCart size={18} />
                  {cartCount > 0 && (
                    <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-semibold text-white">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </span>
                <span className="mt-1 text-center text-xs font-medium">Cart</span>
              </Link>
            </>
          )}

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
                style={{ minWidth: `max(4.5rem, ${100 / mobileItemCount}%)` }}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="relative">
                  <RoleNavIcon id={item.id} size={19} />
                  {item.id === 'messages' && unreadMessageCount > 0 && (
                    <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white">
                      {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                    </span>
                  )}
                </span>
                <span className="text-xs font-medium mt-1 text-center">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Spacer */}
      <div className="h-[calc(4rem+env(safe-area-inset-bottom))] lg:hidden" aria-hidden="true"></div>
    </>
  );
}
