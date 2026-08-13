'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SplashScreen from '@/components/SplashScreen';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.prefetch('/welcome');
    const redirectTimer = setTimeout(() => {
      router.replace('/welcome');
    }, 500);

    return () => clearTimeout(redirectTimer);
  }, [router]);

  return <SplashScreen autoNavigate={false} />;
}
