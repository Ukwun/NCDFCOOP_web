'use client';

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

    // Small delay to allow splash to show for minimum 2 seconds
    const redirectTimer = setTimeout(() => {
      if (!user) {
        // Not authenticated, go to welcome
        router.push('/welcome');
      } else if (!onboardingCompleted) {
        // Authenticated but onboarding not complete
        router.push('/onboarding');
      } else if (!roleSelectionComplete) {
        // Onboarding done but role not selected
        router.push('/role-selection');
      } else {
        // All set, go to home
        router.push('/home');
      }
    }, 2000);

    return () => clearTimeout(redirectTimer);
  }, [user, loading, onboardingCompleted, roleSelectionComplete, router]);

  return <SplashScreen />;
}
