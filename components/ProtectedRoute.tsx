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

  useEffect(() => {
    if (loading) return;

    // Check if user needs to complete workflow steps
    const nextRoute = getNextRoute(user, onboardingCompleted, roleSelectionComplete, currentPath);
    if (nextRoute) {
      router.push(nextRoute);
      return;
    }

    // Check if user has required role for this route
    if (requiredRoles && user?.roles) {
      if (!hasRequiredRole(user.roles, requiredRoles)) {
        router.push('/access-denied');
      }
    }
  }, [user, loading, onboardingCompleted, roleSelectionComplete, requiredRoles, currentPath, router]);

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

  return <>{children}</>;
}

export default ProtectedRoute;
