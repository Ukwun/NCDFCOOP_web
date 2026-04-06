'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/authContext';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading, onboardingCompleted, roleSelectionComplete } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [navigationInitiated, setNavigationInitiated] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (navigationInitiated) return;

    // Wait minimum 2 seconds before navigating
    const timer = setTimeout(() => {
      if (!loading) {
        setNavigationInitiated(true);
        performNavigation();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [loading, navigationInitiated]);

  const performNavigation = () => {
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
  };

  return (
    <>
      <style>{`
        @keyframes fadeInSplash {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .splash-fade-in {
          animation: fadeInSplash 3s ease-in forwards;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .splash-spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>

      <div
        className={`flex min-h-screen flex-col items-center justify-center ${isVisible ? 'splash-fade-in' : 'opacity-0'}`}
        style={{
          backgroundColor: AppColors.background || '#12202F',
        }}
      >
        <div className="flex flex-col items-center gap-6">
          {/* Logo Container */}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '40px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
          >
            <Image
              src="/images/logo/NCDFCOOPLOGO.png"
              alt="NCDF COOP Logo"
              width={80}
              height={80}
              priority
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>

          {/* Brand Name */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                ...AppTextStyles.h1,
                color: AppColors.textPrimary || '#FAFAFA',
                margin: '0 0 8px 0',
              }}
            >
              NCDFCOOP
            </div>
            <div
              style={{
                ...AppTextStyles.bodySmall,
                color: AppColors.textSecondary || '#B0B0B0',
              }}
            >
              Fair Trade Marketplace
            </div>
          </div>

          {/* Loading Spinner */}
          {loading && (
            <div
              style={{
                width: '40px',
                height: '40px',
                borderTop: `3px solid ${AppColors.accent}`,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}
