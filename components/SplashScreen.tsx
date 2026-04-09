'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const AppColors = { background: '#12202F', textPrimary: '#FAFAFA', textSecondary: '#B0B0B0', accent: '#4CAF50' };

export default function SplashScreen() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    // Redirect to welcome after 3 seconds
    const timer = setTimeout(() => {
      router.push('/welcome');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: AppColors.background,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-in',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '40px',
            overflow: 'hidden',
            margin: '0 auto 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            backgroundColor: 'white',
          }}
        >
          <Image
            src="/images/logo/NCDFCOOPLOGO.png"
            alt="NCDF COOP Logo"
            width={80}
            height={80}
            priority
          />
        </div>

        <h1 style={{ color: AppColors.textPrimary, fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
          NCDFCOOP
        </h1>
        <p style={{ color: AppColors.textSecondary, fontSize: '14px', margin: 0 }}>
          Fair Trade Marketplace
        </p>
      </div>
    </div>
  );
}
