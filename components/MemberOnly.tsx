// MemberOnly.tsx
'use client';

import { useAuth } from '@/lib/auth/authContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Wrap member-only pages/components with this HOC to restrict access.
 * Redirects non-members to the membership page.
 */
export default function MemberOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Not authenticated
      if (!user) {
        router.replace('/signup');
        return;
      }
      // Not a member
      if (user.membershipStatus !== 'active') {
        router.replace('/membership');
        return;
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.membershipStatus !== 'active') {
    return (
      <div className="flex items-center justify-center min-h-screen text-lg text-gray-600 dark:text-gray-300">
        Checking membership status...
      </div>
    );
  }

  return <>{children}</>;
}
