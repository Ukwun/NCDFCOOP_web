'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { getNextRoute, hasRequiredRole } from '@/lib/middleware/roleGuard';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
  currentPath: string;
}

export function ProtectedRoute({
  children,
  requiredRoles,
  currentPath,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, loading, onboardingCompleted, roleSelectionComplete, currentRole } = useAuth();

  const nextRoute = !loading
    ? getNextRoute(user, onboardingCompleted, roleSelectionComplete, currentPath)
    : null;
  const hasRoleAccess = !requiredRoles || hasRequiredRole(user?.roles || [], requiredRoles, currentRole);

  useEffect(() => {
    if (loading) return;

    // Check if user needs to complete workflow steps
    if (nextRoute) {
      if (nextRoute === '/signin') {
        const reason = currentPath.startsWith('/checkout') ? '&reason=checkout' : '';
        router.replace(`/signin?next=${encodeURIComponent(currentPath)}${reason}`);
        return;
      }

      if (nextRoute === '/role-selection' && currentPath !== '/role-selection') {
        const operationalPrefixes = [
          '/wholesale',
          '/delivery',
          '/seller',
          '/cart',
          '/checkout',
          '/orders',
          '/analytics',
          '/inquiries',
          '/products',
        ];

        const isOperationalPage = operationalPrefixes.some((prefix) => currentPath.startsWith(prefix));
        const redirectTarget = isOperationalPage
          ? `/role-selection?reason=role_required&from=${encodeURIComponent(currentPath)}`
          : nextRoute;

        router.replace(redirectTarget);
        return;
      }

      router.replace(nextRoute);
      return;
    }

    // Check if user has required role for this route
    if (!hasRoleAccess) {
      router.replace('/access-denied');
    }
  }, [currentPath, loading, nextRoute, hasRoleAccess, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (nextRoute || !hasRoleAccess) {
    return null; // Do not mount protected children while redirecting
  }

  return <>{children}</>;
}

export default ProtectedRoute;
