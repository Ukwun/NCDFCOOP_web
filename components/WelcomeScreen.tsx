'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppColors, AppSpacing, AppTextStyles, AnimationTiming } from '@/lib/theme';
import { getFadeInAnimation } from '@/lib/theme/animations';

interface MembershipType {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: string;
}

const MEMBERSHIP_TYPES: MembershipType[] = [
  {
    id: 'member',
    name: 'Member',
    title: '👤 Member',
    description: 'Access discounts, loyalty rewards, and premium benefits',
  },
  {
    id: 'wholesale',
    name: 'Wholesale',
    title: '🛒 Wholesale Buyer',
    description: 'Bulk buying with wholesale pricing and dedicated support',
  },
  {
    id: 'cooperative',
    name: 'Cooperative',
    title: '🚀 Start Selling',
    description: 'Become a seller and reach members across the cooperative',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation on mount
    setIsVisible(true);
  }, []);

  const handleSelectMembership = async (membershipType: string) => {
    setSelectedType(membershipType);
    setIsLoading(true);

    // Navigate to signup with membership type
    await new Promise((resolve) => setTimeout(resolve, AnimationTiming.normal));
    router.push(`/signup?type=${membershipType}`);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        ${isVisible ? `
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          .welcome-fade-in {
            animation: fadeIn ${AnimationTiming.welcome}ms ease-in forwards;
          }
        ` : ''}
      `}</style>

      <div
        className={`flex min-h-screen items-center justify-center ${isVisible ? 'welcome-fade-in' : 'opacity-0'}`}
        style={{
          backgroundColor: AppColors.background,
        }}
      >
        <div
          className="w-full max-w-md px-6"
          style={{
            maxWidth: '800px',
          }}
        >
          {/* Header */}
          <div className="mb-12 text-center">
            <div
              style={{
                ...AppTextStyles.h1,
                color: AppColors.textPrimary,
                marginBottom: AppSpacing.lg,
              }}
            >
              Welcome to NCDFCOOP
            </div>
            <div
              style={{
                ...AppTextStyles.bodyLarge,
                color: AppColors.textSecondary,
              }}
            >
              Choose your membership type to get started
            </div>
          </div>

          {/* Membership Selection Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: AppSpacing.lg,
              marginBottom: AppSpacing.xxl,
            }}
          >
            {MEMBERSHIP_TYPES.map((membership) => (
              <button
                key={membership.id}
                onClick={() => handleSelectMembership(membership.id)}
                disabled={isLoading}
                style={{
                  padding: AppSpacing.xxxl,
                  backgroundColor:
                    selectedType === membership.id ? AppColors.primaryLight : AppColors.surface,
                  border: `2px solid ${
                    selectedType === membership.id ? AppColors.primary : AppColors.border
                  }`,
                  borderRadius: '16px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 300ms ease-out',
                  opacity: isLoading && selectedType !== membership.id ? 0.5 : 1,
                  transform: selectedType === membership.id ? 'scale(1.02)' : 'scale(1)',
                  boxShadow:
                    selectedType === membership.id
                      ? `0 4px 12px ${AppColors.primary}40`
                      : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.borderColor = AppColors.primary;
                    e.currentTarget.style.backgroundColor = AppColors.primaryContainer;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedType !== membership.id) {
                    e.currentTarget.style.borderColor = AppColors.border;
                    e.currentTarget.style.backgroundColor = AppColors.surface;
                  }
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    fontSize: '48px',
                    marginBottom: AppSpacing.md,
                  }}
                >
                  {membership.title.split(' ')[0]}
                </div>

                {/* Title */}
                <div
                  style={{
                    ...AppTextStyles.h6,
                    color: AppColors.textPrimary,
                    marginBottom: AppSpacing.sm,
                  }}
                >
                  {membership.name}
                </div>

                {/* Description */}
                <div
                  style={{
                    ...AppTextStyles.bodySmall,
                    color: AppColors.textSecondary,
                    lineHeight: '1.5',
                  }}
                >
                  {membership.description}
                </div>
              </button>
            ))}
          </div>

          {/* Already have account link */}
          <div className="text-center">
            <span
              style={{
                ...AppTextStyles.bodyMedium,
                color: AppColors.textSecondary,
                marginRight: AppSpacing.sm,
              }}
            >
              Already have an account?
            </span>
            <button
              onClick={() => router.push('/signin')}
              disabled={isLoading}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                ...AppTextStyles.bodyMedium,
                color: AppColors.primary,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                textDecoration: 'underline',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
