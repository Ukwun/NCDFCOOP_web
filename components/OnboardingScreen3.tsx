'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';

export default function OnboardingScreen3() {
  const router = useRouter();
  const { completeOnboarding } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    '🛍️ Access to wholesale-priced products',
    '🚚 Dedicated delivery support',
    '💳 Flexible payment terms',
    '📊 Sales analytics & insights',
    '🤝 Dedicated account manager',
    '📱 Invoice billing options',
  ];

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
          background: rgba(255, 255, 255, 0.15);
          -webkit-backdrop-filter: blur(20px);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: inset 0 0 60px rgba(255, 255, 255, 0.1), 0 8px 32px rgba(0, 0, 0, 0.1);
        }
      `}</style>

      <div
        className={`relative flex min-h-screen items-end justify-center ${isVisible ? 'onboarding-fade-in' : 'opacity-0'}`}
        style={{
          backgroundImage: 'url(/images/onboarding/onboardingweb3.jpg)',
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

        {/* Glass morphism content card (55% height) */}
        <div
          className="glass-effect relative w-full overflow-y-auto"
          style={{
            minHeight: '55%',
            maxHeight: '65%',
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
            {/* Title with accent */}
            <div
              style={{
                ...AppTextStyles.h2,
                color: AppColors.textPrimary,
                marginBottom: AppSpacing.md,
                fontFamily: '"Libre Baskerville", serif',
              }}
            >
              Unlock Wholesale <span style={{ color: AppColors.accent }}>Power</span>
            </div>

            {/* Subtitle */}
            <div
              style={{
                ...AppTextStyles.bodyMedium,
                color: AppColors.textSecondary,
                marginBottom: AppSpacing.xl,
              }}
            >
              Take your business to the next level with our wholesale platform
            </div>

            {/* Features List */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: AppSpacing.md,
                marginBottom: AppSpacing.xl,
              }}
            >
              {features.map((feature, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: AppSpacing.md,
                    ...AppTextStyles.bodyMedium,
                    color: AppColors.textSecondary,
                  }}
                >
                  <div style={{ fontSize: '20px', flexShrink: 0 }}>
                    {feature.split(' ')[0]}
                  </div>
                  <div>{feature.substring(feature.indexOf(' ') + 1)}</div>
                </div>
              ))}
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
              onClick={() => router.replace('/onboarding2')}
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
              Back
            </button>
            <button
              onClick={async () => {
                setIsLoading(true);
                try {
                  await completeOnboarding();
                  router.push('/role-selection');
                } catch (error) {
                  console.error('Failed to complete onboarding:', error);
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: `${AppSpacing.md} ${AppSpacing.lg}`,
                backgroundColor: AppColors.primary,
                color: AppColors.surface,
                border: 'none',
                borderRadius: '8px',
                ...AppTextStyles.labelLarge,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                transition: 'all 300ms ease-out',
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = AppColors.primaryDark;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = AppColors.primary;
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {isLoading ? 'Loading...' : 'Get Started'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
