'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth/authContext';
import EnhancedNavigation from './EnhancedNavigation';
import GlobalActivityTracker from './GlobalActivityTracker';

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <GlobalActivityTracker />
      <EnhancedNavigation />
      <div className="flex-1">
        {children}
      </div>
    </AuthProvider>
  );
}
