'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';

interface RoleOption {
  id: string;
  title: string;
  description: string;
  color: string;
  benefits: string[];
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'member',
    title: '👤 Member',
    description: 'Access discounts and loyalty rewards',
    color: AppColors.roles.member,
    benefits: [
      'Member pricing',
      'Add money to account',
      'Save money account',
      'Upgrade to Premium Member',
      'Loyalty rewards',
      'Priority support',
    ],
  },
  {
    id: 'wholesale_buyer',
    title: '🛒 Wholesale Buyer',
    description: 'Bulk buying with wholesale pricing',
    color: AppColors.roles.wholesaleBuyer,
    benefits: [
      'Wholesale bulk pricing',
      'Add money to account',
      'Multiple delivery locations',
      'Flexible payment terms',
      'Dedicated account manager',
      'Invoice billing',
    ],
  },
  {
    id: 'seller',
    title: '🚀 Start Selling',
    description: 'Sell to members and wholesalers',
    color: AppColors.roles.seller,
    benefits: [
      'Sell to Members',
      'Sell to Wholesale Buyers',
      'Inventory management',
      'Sales analytics',
      'Marketing tools',
      'Seller support',
    ],
  },
];

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { selectRole } = useAuth();

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSelectRole = async (roleId: string) => {
    if (isLoading) return;

    setSelectedRole(roleId);
    setError('');
    setIsLoading(true);

    try {
      await selectRole(roleId);
      router.push('/home');
    } catch (err: any) {
      setError(err.message || 'Failed to select role. Please try again.');
      setIsLoading(false);
      setSelectedRole(null);
    }
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 py-12"
      style={{
        backgroundColor: AppColors.background,
      }}
    >
      {/* Header */}
      <div className="mb-12 text-center" style={{ maxWidth: '600px' }}>
        <div
          style={{
            ...AppTextStyles.h1,
            color: AppColors.textPrimary,
            marginBottom: AppSpacing.md,
          }}
        >
          Choose Your Primary Role
        </div>
        <div
          style={{
            ...AppTextStyles.bodyLarge,
            color: AppColors.textSecondary,
          }}
        >
          What's your main purpose on NCDFCOOP?
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            marginBottom: AppSpacing.lg,
            padding: AppSpacing.md,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderLeft: `4px solid ${AppColors.error}`,
            borderRadius: AppSpacing.xs,
          }}
        >
          <div
            style={{
              ...AppTextStyles.labelLarge,
              color: AppColors.error,
            }}
          >
            {error}
          </div>
        </div>
      )}

      {/* Role Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: AppSpacing.lg,
          width: '100%',
          maxWidth: '1000px',
          marginBottom: AppSpacing.xxxl,
        }}
      >
        {ROLE_OPTIONS.map((role) => (
          <div
            key={role.id}
            onClick={() => handleSelectRole(role.id)}
            style={{
              padding: AppSpacing.lg,
              borderRadius: AppSpacing.md,
              border: `2px solid ${selectedRole === role.id ? role.color : 'transparent'}`,
              backgroundColor: selectedRole === role.id ? `${role.color}15` : AppColors.surface,
              cursor: 'pointer',
              transition: 'all 200ms ease-out',
              boxShadow: selectedRole === role.id ? `0 0 0 3px ${role.color}30` : 'none',
            }}
            onMouseEnter={(e: any) => {
              if (selectedRole !== role.id) {
                e.currentTarget.style.boxShadow = `0 4px 12px ${role.color}40`;
              }
            }}
            onMouseLeave={(e: any) => {
              if (selectedRole !== role.id) {
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {/* Icon and Radio */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: AppSpacing.md,
              }}
            >
              <div style={{ fontSize: '2.5rem' }}>{role.title.charAt(0)}</div>
              {selectedRole === role.id && (
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: role.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}
                >
                  ✓
                </div>
              )}
            </div>

            {/* Title */}
            <div
              style={{
                ...AppTextStyles.h3,
                color: AppColors.textPrimary,
                marginBottom: AppSpacing.sm,
              }}
            >
              {role.title}
            </div>

            {/* Description */}
            <div
              style={{
                ...AppTextStyles.bodySmall,
                color: AppColors.textSecondary,
                marginBottom: AppSpacing.md,
              }}
            >
              {role.description}
            </div>

            {/* Benefits */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: AppSpacing.xs }}>
              {role.benefits.map((benefit, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: AppSpacing.sm,
                    ...AppTextStyles.labelLarge,
                    color: AppColors.textSecondary,
                  }}
                >
                  <span style={{ color: role.color }}>✓</span>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            {/* Selected Indicator */}
            {selectedRole === role.id && (
              <div
                style={{
                  marginTop: AppSpacing.lg,
                  padding: AppSpacing.md,
                  backgroundColor: role.color,
                  color: 'white',
                  borderRadius: '8px',
                  textAlign: 'center',
                  ...AppTextStyles.labelLarge,
                }}
              >
                {isLoading ? 'Selecting...' : 'Selected'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
