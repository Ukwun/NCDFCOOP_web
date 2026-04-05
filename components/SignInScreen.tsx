'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';

export default function SignInScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Basic validation
      if (!email || !password) {
        setError('Please enter email and password');
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

      // Call login function
      await login(email, password);

      // Successful login - redirect to home or onboarding
      router.push('/home');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
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
            Sign In
          </div>
          <div
            style={{
              ...AppTextStyles.bodyMedium,
              color: AppColors.textSecondary,
            }}
          >
            Welcome back to NCDFCOOP
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

          {/* Remember Me & Forgot Password */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: AppSpacing.lg,
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                ...AppTextStyles.bodySmall,
                color: AppColors.textSecondary,
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                style={{
                  marginRight: AppSpacing.sm,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  width: '18px',
                  height: '18px',
                  accentColor: AppColors.primary,
                }}
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => router.push('/forgot-password')}
              disabled={isLoading}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                ...AppTextStyles.bodySmall,
                color: AppColors.primary,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                textDecoration: 'none',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              Forgot password?
            </button>
          </div>

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

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: `${AppSpacing.md} ${AppSpacing.lg}`,
              backgroundColor: isLoading ? AppColors.disabled : AppColors.primary,
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
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="text-center">
          <span
            style={{
              ...AppTextStyles.bodyMedium,
              color: AppColors.textSecondary,
              marginRight: AppSpacing.sm,
            }}
          >
            Don&apos;t have an account?
          </span>
          <button
            onClick={() => router.push('/welcome')}
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
            Create account
          </button>
        </div>
      </div>
    </div>
  );
}
