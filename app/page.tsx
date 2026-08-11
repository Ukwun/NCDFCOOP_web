'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { getAuthenticatedLandingPath } from '@/lib/auth/roleRouting';
import SplashScreen from '@/components/SplashScreen';

export default function Home() {
  const router = useRouter();
  const { user, loading, currentRole, roleSelectionComplete } = useAuth();

  // Redirect based on auth state after initial load
  useEffect(() => {
    if (loading) return;

    // Small delay to allow splash to show for minimum 3 seconds
    const redirectTimer = setTimeout(() => {
      if (!user) {
        router.replace('/welcome');
        return;
      }

      router.replace(
        getAuthenticatedLandingPath(currentRole, roleSelectionComplete),
      );
    }, 3000);

    return () => clearTimeout(redirectTimer);
  }, [user, loading, currentRole, roleSelectionComplete, router]);

  return <SplashScreen autoNavigate={false} />;
}
