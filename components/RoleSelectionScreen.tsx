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
          Select Your Role
        </div>
        <div
          style={{
            ...AppTextStyles.bodyLarge,
            color: AppColors.textSecondary,
          }}
        >
          Choose how you want to participate in NCDFCOOP. You can change this later.
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: AppSpacing.lg,
            backgroundColor: `${AppColors.error}20`,
            border: `1px solid ${AppColors.error}`,
            borderRadius: '8px',
            marginBottom: AppSpacing.xl,
            maxWidth: '600px',
            width: '100%',
            ...AppTextStyles.bodyMedium,
            color: AppColors.error,
          }}
        >
          {error}
        </div>
      )}

      {/* Role Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: AppSpacing.xl,
          maxWidth: '1000px',
          width: '100%',
          marginBottom: AppSpacing.xxl,
        }}
      >
        {ROLE_OPTIONS.map((role) => (
          <div
            key={role.id}
            onClick={() => handleSelectRole(role.id)}
            style={{
              padding: AppSpacing.xxl,
              backgroundColor:
                selectedRole === role.id
                  ? `${role.color}20`
                  : AppColors.surface,
              border:
                selectedRole === role.id
                  ? `2px solid ${role.color}`
                  : `2px solid ${AppColors.border}`,
              borderRadius: '16px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 300ms ease-out',
              opacity: isLoading && selectedRole !== role.id ? 0.5 : 1,
              transform:
                selectedRole === role.id ? 'scale(1.02)' : 'scale(1)',
              boxShadow:
                selectedRole === role.id
                  ? `0 4px 20px ${role.color}40`
                  : 'none',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.borderColor = role.color;
                e.currentTarget.style.backgroundColor = `${role.color}10`;
                e.currentTarget.style.transform = 'translateY(-4px)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedRole !== role.id) {
                e.currentTarget.style.borderColor = AppColors.border;
                e.currentTarget.style.backgroundColor = AppColors.surface;
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {/* Role Icon & Title */}
            <div
              style={{
                fontSize: '32px',
                marginBottom: AppSpacing.md,
              }}
            >
              {role.title.split(' ')[0]}
            </div>

            <div
              style={{
                ...AppTextStyles.h4,
                color: AppColors.textPrimary,
                marginBottom: AppSpacing.sm,
              }}
            >
              {role.title.substring(role.title.indexOf(' ') + 1)}
            </div>

            {/* Description */}
            <div
              style={{
                ...AppTextStyles.bodyMedium,
                color: role.color,
                marginBottom: AppSpacing.lg,
                fontWeight: 600,
              }}
            >
              {role.description}
            </div>

            {/* Benefits List */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: AppSpacing.sm,
              }}
            >
              {role.benefits.map((benefit, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: AppSpacing.md,
                    ...AppTextStyles.bodySmall,
                    color: AppColors.textSecondary,
                  }}
                >
                  <span
                    style={{
                      color: role.color,
                      fontWeight: 'bold',
                      fontSize: '16px',
                    }}
                  >
                    ✓
                  </span>
                  {benefit}
                </div>
              ))}
            </div>

            {/* Selection Indicator */}
            {selectedRole === role.id && (
              <div
                style={{
                  marginTop: AppSpacing.lg,
                  padding: AppSpacing.md,
                  backgroundColor: role.color,
                  color: AppColors.surface,
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

      color: '#2E5090',
      colorBg: 'bg-blue-50',
      description: 'Buy in bulk with wholesale prices',
      benefits: [
        'Bulk pricing',
        'Add money to account',
        'Multiple delivery locations',
        'Flexible payment terms',
        'Account manager',
        'Invoice billing available',
      ],
      selected: false,
    },
    {
      id: USER_ROLES.SELLER,
      name: USER_ROLES.SELLER,
      displayName: 'Start Selling Now',
      icon: '🚀',
      color: '#0B6B3A',
      colorBg: 'bg-green-50',
      description: 'Sell & reach customers here',
      benefits: [
        'Sell to Members',
        'Sell to Wholesale Buyers',
        'Inventory management',
        'Sales analytics',
        'Marketing tools',
        'Seller support',
      ],
      selected: false,
    },
  ];

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setError(null);
  };

  const handleContinue = async () => {
    if (!selectedRole) {
      setError('Please select a role to continue');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await selectRole(selectedRole);

      // Route to appropriate next screen
      if (selectedRole === USER_ROLES.SELLER) {
        // Sellers go to onboarding
        router.push('/seller/onboarding');
      } else {
        // Members and buyers go directly to home
        router.push('/home');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to select role');
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      setLoading(true);
      // Default to member role
      await selectRole(USER_ROLES.MEMBER);
      router.push('/home');
    } catch (err: any) {
      setError(err.message || 'Failed to skip');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Choose Your Primary Role
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            What's your main purpose on NCDFCOOP?
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
            <p className="text-red-800 dark:text-red-100">{error}</p>
          </div>
        )}

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => handleRoleSelect(role.id)}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                selectedRole === role.id
                  ? `border-[${role.color}] ${role.colorBg} shadow-lg`
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md'
              }`}
              style={
                selectedRole === role.id
                  ? {
                      borderColor: role.color,
                      backgroundColor: role.colorBg,
                    }
                  : undefined
              }
            >
              {/* Radio Button */}
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{role.icon}</div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedRole === role.id
                      ? 'border-current bg-current'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  style={
                    selectedRole === role.id
                      ? { borderColor: role.color, backgroundColor: role.color }
                      : undefined
                  }
                >
                  {selectedRole === role.id && (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>

              {/* Role Title */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {role.displayName}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                {role.description}
              </p>

              {/* Benefits */}
              <div className="space-y-2">
                {role.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs">✓</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleContinue}
            disabled={!selectedRole || loading}
            className={`px-8 py-3 rounded-lg font-semibold transition-all ${
              selectedRole && !loading
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Processing...' : 'Continue →'}
          </button>
          <button
            onClick={handleSkip}
            disabled={loading}
            className="px-8 py-3 rounded-lg font-semibold border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            Skip for Now
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-12 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Your role determines your shopping experience, available features, and pricing tiers.{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Learn more about roles
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
