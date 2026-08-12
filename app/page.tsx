'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import SplashScreen from '@/components/SplashScreen';

export default function Home() {
  const router = useRouter();
  const { loading } = useAuth();

  // Redirect based on auth state after initial load
  useEffect(() => {
    if (loading) return;

    // The public homepage is the universal entry point. Authentication is
    // preserved there so returning users can explicitly open their dashboard.
    const redirectTimer = setTimeout(() => {
      router.replace('/welcome');
    }, 3000);

    return () => clearTimeout(redirectTimer);
  }, [loading, router]);

  return <SplashScreen autoNavigate={false} />;
}
