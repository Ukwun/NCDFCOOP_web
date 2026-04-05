'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { AppColors, AppSpacing, AnimationTiming } from '@/lib/theme';

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading, onboardingCompleted, roleSelectionComplete } = useAuth();
  const [hasNavigated, setHasNavigated] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Trigger fade-in animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    // Prevent duplicate navigation
    if (hasNavigated) return;

    // Only proceed after: 1) at least 2 seconds, AND 2) loading is complete
    const splashTimer = setTimeout(() => {
      if (loading) {
        // Still loading, just return and let the next render attempt try again
        return;
      }

      // Loading is done, now navigate based on user state
      setHasNavigated(true);

      if (!user) {
        // Unauthenticated - go to welcome/membership selection
        router.push('/welcome');
      } else if (!onboardingCompleted) {
        // Authenticated but haven't completed onboarding - show onboarding flow
        router.push('/onboarding');
      } else if (!roleSelectionComplete) {
        // Onboarding done but haven't selected role - show role selection
        router.push('/role-selection');
      } else {
        // Fully onboarded - go to home
        router.push('/home');
      }
    }, 2000);

    return () => clearTimeout(splashTimer);
  }, [user, loading, onboardingCompleted, roleSelectionComplete, router, hasNavigated]);

  // Fallback: If loading takes very long (5+ seconds), force navigation anyway
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!hasNavigated && !loading) {
        setHasNavigated(true);
        if (!user) {
          router.push('/welcome');
        } else if (!onboardingCompleted) {
          router.push('/onboarding');
        } else if (!roleSelectionComplete) {
          router.push('/role-selection');
        } else {
          router.push('/home');
        }
      }
    }, 5000);

    return () => clearTimeout(fallbackTimer);
  }, [user, loading, onboardingCompleted, roleSelectionComplete, router, hasNavigated]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Inter:wght@400;700&display=swap');
        
        @keyframes fadeInSplash {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .splash-fade-in {
          animation: fadeInSplash 1.5s ease-in forwards;
        }
        
        .splash-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
      
      <div 
        className={`flex min-h-screen flex-col items-center justify-center ${isVisible ? 'splash-fade-in' : 'opacity-0'}`}
        style={{
          backgroundColor: AppColors.splashBackground,
        }}
      >
        <div className="flex flex-col items-center" style={{ gap: AppSpacing.xxl }}>
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
              backgroundColor: AppColors.surface,
              boxShadow: `0 4px 12px ${AppColors.primary}40`,
            }}
          >
            <div
              style={{
                fontSize: '48px',
              }}
            >
              🛍️
            </div>
          </div>

          {/* App Name */}
          <div
            style={{
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: AppColors.surface,
                fontFamily: '"Libre Baskerville", serif',
                marginBottom: AppSpacing.sm,
                letterSpacing: '-0.5px',
              }}
            >
              NCDFCOOP
            </h1>
            <p
              style={{
                fontSize: '14px',
                color: `${AppColors.surface}99`,
                fontWeight: 500,
                margin: 0,
              }}
            >
              Commerce Platform
            </p>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div
              style={{
                width: '40px',
                height: '40px',
                border: `3px solid ${AppColors.surface}20`,
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
        
        .splash-fade-in {
          animation: fadeInSplash 1.5s ease-in forwards;
        }
      `}</style>
      
      <div 
        className="flex min-h-screen items-center justify-center splash-fade-in"
        style={{ backgroundColor: '#12202F' }}
      >
        <div className="flex flex-col items-center" style={{ gap: '24px' }}>
          {/* Logo - 60x60px with border-radius 30px */}
          <div 
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '30px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Image
              src="/images/logo/NCDFCOOPLOGO.png"
              alt="NCDF COOP Logo"
              width={60}
              height={60}
              priority
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>

          {/* Title - "Welcome to" */}
          <p 
            style={{
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontSize: '20px',
              fontWeight: 700,
              color: '#FAFAFA',
              margin: 0,
              textAlign: 'center',
            }}
          >
            Welcome to
          </p>

          {/* Brand Name - Split Color */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {/* NCDF in Lime Green */}
            <span 
              style={{
                fontFamily: '"Libre Baskerville", Georgia, serif',
                fontSize: '36px',
                fontWeight: 700,
                color: '#98D32A',
              }}
            >
              NCDF
            </span>
            {/* COOP in Orange */}
            <span 
              style={{
                fontFamily: '"Libre Baskerville", Georgia, serif',
                fontSize: '36px',
                fontWeight: 700,
                color: '#F3951A',
              }}
            >
              COOP
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
