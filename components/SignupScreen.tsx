'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signup } = useAuth();

  const membershipType = searchParams.get('type') || 'member';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validation
      if (!email || !password || !confirmPassword) {
        setError('Please fill in all fields');
        setIsLoading(false);
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Please enter a valid email address');
        setIsLoading(false);
        return;
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        setIsLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      if (!agreeToTerms) {
        setError('Please agree to the terms and conditions');
        setIsLoading(false);
        return;
      }

      // Call signup function with membership type
      await signup(email, password, membershipType);

      // Successful signup - redirect to role selection
      router.push('/role-selection');
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{
        backgroundColor: AppColors.background,
      }}
    >
      <div
        className="w-full px-6"
        style={{
          maxWidth: '400px',
        }}
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <div
            style={{
              ...AppTextStyles.h2,
              color: AppColors.textPrimary,
              marginBottom: AppSpacing.md,
            }}
          >
            Create Account
          </div>
          <div
            style={{
              ...AppTextStyles.bodyMedium,
              color: AppColors.textSecondary,
              marginBottom: AppSpacing.md,
            }}
          >
            Join NCDFCOOP as a{' '}
            <span
              style={{
                fontWeight: 600,
                color: AppColors.primary,
              }}
            >
              {membershipType.charAt(0).toUpperCase() + membershipType.slice(1)}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div
            style={{
              marginBottom: AppSpacing.lg,
            }}
          >
            <label
              style={{
                display: 'block',
                marginBottom: AppSpacing.sm,
                ...AppTextStyles.labelLarge,
                color: AppColors.textPrimary,
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: `${AppSpacing.md} ${AppSpacing.lg}`,
                border: `1px solid ${error ? AppColors.error : AppColors.border}`,
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: AppColors.surface,
                color: AppColors.textPrimary,
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? 'not-allowed' : 'auto',
                transition: 'all 300ms ease-out',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Password Field */}
          <div
            style={{
              marginBottom: AppSpacing.lg,
            }}
          >
            <label
              style={{
                display: 'block',
                marginBottom: AppSpacing.sm,
                ...AppTextStyles.labelLarge,
                color: AppColors.textPrimary,
              }}
            >
              Password
            </label>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: `${AppSpacing.md} ${AppSpacing.lg}`,
                  paddingRight: '40px',
                  border: `1px solid ${error ? AppColors.error : AppColors.border}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: AppColors.surface,
                  color: AppColors.textPrimary,
                  opacity: isLoading ? 0.6 : 1,
                  cursor: isLoading ? 'not-allowed' : 'auto',
                  transition: 'all 300ms ease-out',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                style={{
                  position: 'absolute',
                  right: AppSpacing.lg,
                  background: 'none',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  color: AppColors.textSecondary,
                  padding: 0,
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div
            style={{
              marginBottom: AppSpacing.lg,
            }}
          >
            <label
              style={{
                display: 'block',
                marginBottom: AppSpacing.sm,
                ...AppTextStyles.labelLarge,
                color: AppColors.textPrimary,
              }}
            >
              Confirm Password
            </label>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: `${AppSpacing.md} ${AppSpacing.lg}`,
                  paddingRight: '40px',
                  border: `1px solid ${error ? AppColors.error : AppColors.border}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: AppColors.surface,
                  color: AppColors.textPrimary,
                  opacity: isLoading ? 0.6 : 1,
                  cursor: isLoading ? 'not-allowed' : 'auto',
                  transition: 'all 300ms ease-out',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
                style={{
                  position: 'absolute',
                  right: AppSpacing.lg,
                  background: 'none',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  color: AppColors.textSecondary,
                  padding: 0,
                }}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* Terms & Conditions */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              ...AppTextStyles.bodySmall,
              color: AppColors.textSecondary,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginBottom: AppSpacing.lg,
            }}
          >
            <input
              type="checkbox"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              disabled={isLoading}
              style={{
                marginRight: AppSpacing.sm,
                marginTop: '2px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                width: '18px',
                height: '18px',
                accentColor: AppColors.primary,
                flexShrink: 0,
              }}
            />
            <span>
              I agree to the{' '}
              <button
                type="button"
                onClick={() => {
                  /* Handle terms link */
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: AppColors.primary,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Terms & Conditions
              </button>
              {' and '}
              <button
                type="button"
                onClick={() => {
                  /* Handle privacy link */
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: AppColors.primary,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Privacy Policy
              </button>
            </span>
          </label>

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: AppSpacing.md,
                backgroundColor: `${AppColors.error}20`,
                border: `1px solid ${AppColors.error}`,
                borderRadius: '8px',
                marginBottom: AppSpacing.lg,
                ...AppTextStyles.bodySmall,
                color: AppColors.error,
              }}
            >
              {error}
            </div>
          )}

          {/* Sign Up Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: `${AppSpacing.md} ${AppSpacing.lg}`,
              backgroundColor: isLoading ? AppColors.textDisabled : AppColors.primary,
              color: AppColors.surface,
              border: 'none',
              borderRadius: '8px',
              ...AppTextStyles.labelLarge,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 300ms ease-out',
              marginBottom: AppSpacing.lg,
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = AppColors.primaryDark;
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = AppColors.primary;
              }
            }}
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Sign In Link */}
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
  );
}

export default function SignUpScreen() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpContent />
    </Suspense>
  );
}
