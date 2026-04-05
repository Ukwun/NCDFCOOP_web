'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { lazyRouteComponents, preloadRoute, trackCodeSplittingMetrics } from '@/lib/optimization/lazyRoutes';
import { LazyLoginScreen, LazySignupScreen } from '@/lib/optimization/lazyRoutes';

export default function Navigation() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const [showSignup, setShowSignup] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return showSignup ? (
      <LazySignupScreen/>
    ) : (
      <div onClick={() => setShowSignup(false)}>
        <LazyLoginScreen />
        <div className="fixed bottom-4 left-4 right-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <button
            onClick={() => setShowSignup(true)}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Sign up here
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'offer', label: 'Offer', icon: '🎁' },
    { id: 'message', label: 'Message', icon: '💬' },
    { id: 'cart', label: 'Cart', icon: '🛒' },
    { id: 'profile', label: 'My NCDFCOOP', icon: '👤' },
  ];

  const renderScreen = () => {
    const routes = {
      home: 'home',
      offer: 'offer',
      message: 'message',
      cart: 'cart',
      profile: 'profile',
    } as const;

    const routeKey = activeTab as keyof typeof routes;
    const Component = lazyRouteComponents[routeKey] || lazyRouteComponents.home;
    
    return <Component />;
  };

  // Track code splitting metrics
  useState(() => {
    if (typeof window !== 'undefined') {
      trackCodeSplittingMetrics();
    }
  });

  // Preload routes on hover (optimization)
  const handleTabHover = (tabId: string) => {
    const routes: Record<string, 'home' | 'offer' | 'message' | 'cart' | 'profile'> = {
      home: 'home',
      offer: 'offer',
      message: 'message',
      cart: 'cart',
      profile: 'profile',
    };
    
    const route = routes[tabId];
    if (route) {
      preloadRoute(route);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutDialog(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {renderScreen()}
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:top-0 md:bottom-auto md:right-auto md:w-48 md:border-t-0 md:border-r md:h-screen md:flex md:flex-col">
        {/* Top header for desktop */}
        <div className="hidden md:flex items-center justify-between h-16 border-b border-gray-200 dark:border-gray-700 px-4">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">NCDFCOOP</h1>
          <button
            onClick={() => setShowLogoutDialog(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Logout"
          >
            🚪
          </button>
        </div>

        {/* Navigation items */}
        <div className="flex md:flex-col justify-around md:justify-start md:flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              onMouseEnter={() => handleTabHover(tab.id)}
              className={`flex-1 md:flex-none md:h-16 md:px-4 flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 py-2 md:py-0 transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 md:bg-blue-50 dark:md:bg-blue-950'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title={`Week 2: Lazy-loaded ${tab.label} (preloads on hover)`}
            >
              <span className="text-xl md:text-lg">{tab.icon}</span>
              <span className="text-xs md:text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Mobile logout button */}
        <button
          onClick={() => setShowLogoutDialog(true)}
          className="md:hidden m-4 w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Logout
        </button>
      </nav>

      {/* Spacer for mobile */}
      <div className="h-20 md:hidden"></div>

      {/* Logout Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Logout?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to logout?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutDialog(false)}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
