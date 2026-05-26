'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { getNextRoute, hasRequiredRole, ROUTE_ROLE_REQUIREMENTS } from '@/lib/middleware/roleGuard';

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
  const { user, loading, onboardingCompleted, roleSelectionComplete } = useAuth();

  const nextRoute = !loading
    ? getNextRoute(user, onboardingCompleted, roleSelectionComplete, currentPath)
    : null;
  const hasRoleAccess = !requiredRoles || hasRequiredRole(user?.roles || [], requiredRoles);

  useEffect(() => {
    if (loading) return;

    // Check if user needs to complete workflow steps
    if (nextRoute) {
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

        router.push(redirectTarget);
        return;
      }

      router.push(nextRoute);
      return;
    }

    // Check if user has required role for this route
    if (!hasRoleAccess) {
      router.push('/access-denied');
    }
  }, [loading, nextRoute, hasRoleAccess, router]);

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
