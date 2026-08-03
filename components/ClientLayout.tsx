'use client';

import { ReactNode } from 'react';
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
      <GlobalActivityTracker />
      <EnhancedNavigation />
      <div className="flex-1">{children}</div>
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
