'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import SplashScreen from '@/components/SplashScreen';

export default function Home() {
  const router = useRouter();
  const { user, loading, onboardingCompleted, roleSelectionComplete } = useAuth();

  // Redirect based on auth state after initial load
  useEffect(() => {
    if (loading) return;

    // Small delay to allow splash to show for minimum 3 seconds
    const redirectTimer = setTimeout(() => {
      // Step 1: Not authenticated yet - show onboarding first
      if (!user && !onboardingCompleted) {
        router.push('/onboarding');
      }
      // Step 2: Saw onboarding but not authenticated yet - go to signup
      else if (!user && onboardingCompleted) {
        router.push('/welcome');
      }
      // Step 3: Authenticated but no role selected - go to role selection
      else if (user && !roleSelectionComplete) {
        router.push('/role-selection');
      }
      // Step 4: All complete - go to home
      else if (user && roleSelectionComplete) {
        router.push('/home');
      }
    }, 3000);

    return () => clearTimeout(redirectTimer);
  }, [user, loading, onboardingCompleted, roleSelectionComplete, router]);

  return <SplashScreen />;
}
