'use client';

import { ReactNode, Suspense } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth/authContext';
import { USER_ROLES } from '@/lib/constants/database';
import EnhancedNavigation from './EnhancedNavigation';
import GlobalActivityTracker from './GlobalActivityTracker';

function RoleAwareApplication({ children }: { children: ReactNode }) {
  const { user, currentRole } = useAuth();
  const usesBuyerInputTheme = Boolean(
    user &&
      (currentRole === USER_ROLES.MEMBER ||
        currentRole === USER_ROLES.INSTITUTIONAL_BUYER),
  );

  return (
    <div
      className="min-h-screen"
      data-buyer-input-theme={usesBuyerInputTheme ? 'light' : undefined}
      data-active-role={currentRole || undefined}
    >
      <Suspense fallback={null}>
        <GlobalActivityTracker />
      </Suspense>
      <EnhancedNavigation />
      <div className="flex-1">
        <Suspense
          fallback={(
            <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-live="polite">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
              <span className="sr-only">Loading page</span>
            </div>
          )}
        >
          {children}
        </Suspense>
      </div>
    </div>
  );
}

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <RoleAwareApplication>{children}</RoleAwareApplication>
    </AuthProvider>
  );
}
