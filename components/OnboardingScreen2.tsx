'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';

interface MembershipTier {
  id: string;
  name: string;
  discount: string;
  color: string;
}

const MEMBERSHIP_TIERS: MembershipTier[] = [
  { id: 'bronze', name: 'Bronze', discount: '5%', color: '#8B6F47' },
  { id: 'silver', name: 'Silver', discount: '10%', color: '#A8A9AD' },
  { id: 'gold', name: 'Gold', discount: '15%', color: '#C9A227' },
  { id: 'platinum', name: 'Platinum', discount: '20%', color: '#E8D4B5' },
];

export default function OnboardingScreen2() {
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
          backgroundImage: 'url(/images/onboarding/onboardingweb2.jpg)',
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

        {/* Glass morphism content card */}
        <div
          className="glass-effect relative w-full overflow-y-auto"
          style={{
            maxHeight: '60%',
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
            {/* Title */}
            <div
              style={{
                ...AppTextStyles.h2,
                color: AppColors.textPrimary,
                marginBottom: AppSpacing.md,
                fontFamily: '"Libre Baskerville", serif',
              }}
            >
              Membership <span style={{ color: AppColors.accent }}>Benefits</span>
            </div>

            {/* Subtitle */}
            <div
              style={{
                ...AppTextStyles.bodyMedium,
                color: AppColors.textSecondary,
                marginBottom: AppSpacing.xl,
              }}
            >
              Unlock exclusive discounts at each membership tier
            </div>

            {/* Membership Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: AppSpacing.md,
                marginBottom: AppSpacing.xl,
              }}
            >
              {MEMBERSHIP_TIERS.map((tier) => (
                <div
                  key={tier.id}
                  style={{
                    padding: AppSpacing.lg,
                    backgroundColor: AppColors.surface,
                    border: `2px solid ${tier.color}`,
                    borderRadius: '12px',
                    textAlign: 'center',
                    transition: 'all 300ms ease-out',
                  }}
                >
                  {/* Badge */}
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      margin: '0 auto ' + AppSpacing.md,
                      backgroundColor: tier.color,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      ...AppTextStyles.h4,
                      color: AppColors.surface,
                    }}
                  >
                    {tier.discount}
                  </div>

                  {/* Tier name */}
                  <div
                    style={{
                      ...AppTextStyles.labelLarge,
                      color: AppColors.textPrimary,
                      marginBottom: AppSpacing.sm,
                    }}
                  >
                    {tier.name}
                  </div>

                  {/* Tier description */}
                  <div
                    style={{
                      ...AppTextStyles.bodySmall,
                      color: AppColors.textSecondary,
                    }}
                  >
                    Unlock at spending milestone
                  </div>
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
              onClick={() => router.replace('/onboarding1')}
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
              onClick={() => router.push('/onboarding3')}
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
          </div>
        </div>
      </div>
    </>
  );
}
