'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';

export default function OnboardingScreen1() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Inter:wght@400;600;700&display=swap');
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .onboarding-fade-in {
          animation: fadeIn 1000ms ease-in forwards;
        }

        .glass-effect {
          background: rgba(250, 250, 250, 0.95);
          -webkit-backdrop-filter: blur(20px);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
      `}</style>

      <div
        className={`relative flex min-h-screen items-end justify-center ${isVisible ? 'onboarding-fade-in' : 'opacity-0'}`}
        style={{
          backgroundImage: 'url(/images/onboarding/onboardingweb1.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: AppColors.border,
        }}
      >
        {/* Semi-transparent overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }}
        />

        {/* Glass morphism content card (bottom 50%) */}
        <div
          className="glass-effect relative w-full"
          style={{
            height: '50%',
            borderRadius: '25px 25px 0 0',
            padding: AppSpacing.xxxl,
            boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Content */}
          <div>
            {/* Title with accent color */}
            <div
              style={{
                ...AppTextStyles.h2,
                color: AppColors.textPrimary,
                marginBottom: AppSpacing.md,
                fontFamily: '"Libre Baskerville", serif',
              }}
            >
              Welcome to{' '}
              <span style={{ color: AppColors.accent }}>NCDFCOOP</span>
            </div>

            {/* Subtitle */}
            <div
              style={{
                ...AppTextStyles.bodyLarge,
                color: AppColors.textSecondary,
                lineHeight: '1.6',
                marginBottom: AppSpacing.xl,
              }}
            >
              Nigeria&apos;s controlled trade infrastructure for reliable buying and selling
            </div>
          </div>

          {/* Navigation buttons */}
          <div
            style={{
              display: 'flex',
              gap: AppSpacing.lg,
              marginTop: AppSpacing.lg,
            }}
          >
            <button
              onClick={() => router.push('/onboarding2')}
              style={{
                flex: 1,
                padding: `${AppSpacing.md} ${AppSpacing.lg}`,
                backgroundColor: AppColors.primary,
                color: AppColors.surface,
                border: 'none',
                borderRadius: '8px',
                ...AppTextStyles.labelLarge,
                cursor: 'pointer',
                transition: 'all 300ms ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = AppColors.primaryDark;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = AppColors.primary;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Next
            </button>
            <button
              onClick={() => router.push('/welcome')}
              style={{
                flex: 1,
                padding: `${AppSpacing.md} ${AppSpacing.lg}`,
                backgroundColor: 'transparent',
                color: AppColors.primary,
                border: `2px solid ${AppColors.primary}`,
                borderRadius: '8px',
                ...AppTextStyles.labelLarge,
                cursor: 'pointer',
                transition: 'all 300ms ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${AppColors.primary}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
