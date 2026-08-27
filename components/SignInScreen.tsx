"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import SocialSignInButtons from "@/components/SocialSignInButtons";
import { useAuth } from "@/lib/auth/authContext";
import { AppColors, AppSpacing, AppTextStyles } from "@/lib/theme";
import { getAuthenticatedLandingPath } from "@/lib/auth/roleRouting";

function readableAuthError(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function SignInScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    user,
    loading,
    currentRole,
    roleSelectionComplete,
    login,
    signInWithGoogle,
    signInWithFacebook,
    signInWithApple,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const requestedPath = searchParams.get("next");
  const reason = searchParams.get("reason");
  const safeRequestedPath = requestedPath?.startsWith("/") &&
    !requestedPath.startsWith("//")
    ? requestedPath
    : null;
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  useEffect(() => {
    const expired = window.sessionStorage.getItem("coopx_session_expired") === "true";
    if (expired) {
      window.sessionStorage.removeItem("coopx_session_expired");
      setSessionExpiredNotice(true);
    }
  }, []);

  const authNotice =
    sessionExpiredNotice
      ? "For your security, CoopX sessions expire after 24 hours. Please sign in again to continue."
      : reason === "marketplace_auth_required" || reason === "cart"
      ? "Please sign in or create an account to view product details, add items to your cart, and continue checkout."
      : reason === "checkout"
        ? "Please sign in or create an account before continuing to checkout."
        : "";

  const resolveDestination = useCallback(
    (roleDestination: string) =>
      safeRequestedPath && roleDestination !== "/role-selection"
        ? safeRequestedPath
        : roleDestination,
    [safeRequestedPath],
  );

  useEffect(() => {
    if (!loading && user && !isLoading && !socialLoading) {
      router.replace(
        resolveDestination(
          getAuthenticatedLandingPath(currentRole, roleSelectionComplete),
        ),
      );
    }
  }, [
    currentRole,
    isLoading,
    loading,
    roleSelectionComplete,
    router,
    socialLoading,
    user,
    resolveDestination,
  ]);

  const handleGoogleSignIn = async () => {
    setError("");
    setSocialLoading(true);
    try {
      const destination = await signInWithGoogle();
      if (destination) router.replace(resolveDestination(destination));
    } catch (err: unknown) {
      setError(readableAuthError(err, "Google sign-in failed."));
    } finally {
      setSocialLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setError(""); setSocialLoading(true);
    try { const destination = await signInWithFacebook(); if (destination) router.replace(resolveDestination(destination)); }
    catch (err: unknown) { setError(readableAuthError(err, "Facebook sign-in failed.")); }
    finally { setSocialLoading(false); }
  };

  const handleAppleSignIn = async () => {
    setError(""); setSocialLoading(true);
    try { const destination = await signInWithApple(); if (destination) router.replace(resolveDestination(destination)); }
    catch (err: unknown) { setError(readableAuthError(err, "Apple sign-in failed.")); }
    finally { setSocialLoading(false); }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Basic validation
      if (!email || !password) {
        setError("Please enter email and password");
        setIsLoading(false);
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("Please enter a valid email address");
        setIsLoading(false);
        return;
      }

      const destination = await login(email, password, rememberMe);
      router.replace(resolveDestination(destination));
    } catch (err: unknown) {
      setError(
        readableAuthError(err, "Failed to sign in. Please check your credentials."),
      );
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .signin-container {
          animation: slideIn 0.6s ease-out;
        }
        .signin-error {
          animation: shake 0.5s cubic-bezier(0.36, 0, 0.66, 1);
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        }
        .signin-button {
          transition: all 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
        }
        .signin-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }
        .signin-button:active:not(:disabled) {
          transform: translateY(0px);
        }
        .signin-link {
          transition: all 200ms ease;
        }
        .signin-link:hover:not(:disabled) {
          transform: translateX(2px);
        }
      `}</style>
      <div
        className="signin-container flex min-h-screen items-center justify-center"
        style={{
          backgroundColor: AppColors.background,
        }}
      >
        <div
          className="w-full px-6"
          style={{
            maxWidth: "400px",
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
              Welcome back to CoopX
            </div>
          </div>

          {/* Social Auth Buttons */}
          {authNotice && (
            <div
              role="status"
              style={{
                padding: AppSpacing.md,
                border: `1px solid ${AppColors.primary}`,
                borderRadius: "8px",
                marginBottom: AppSpacing.lg,
                ...AppTextStyles.bodySmall,
                backgroundColor: "#ecfdf5",
                color: AppColors.primary,
                lineHeight: 1.5,
              }}
            >
              {authNotice}
            </div>
          )}

          <SocialSignInButtons
            onGoogleSignIn={handleGoogleSignIn}
            onFacebookSignIn={handleFacebookSignIn}
            onAppleSignIn={handleAppleSignIn}
            isLoading={socialLoading}
          />

          <div
            style={{
              textAlign: "center",
              margin: "18px 0",
              color: AppColors.textSecondary,
            }}
          >
            or continue with email
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
                  display: "block",
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
                  width: "100%",
                  padding: `${AppSpacing.md} ${AppSpacing.lg}`,
                  border: `1px solid ${error ? AppColors.error : AppColors.border}`,
                  borderRadius: "8px",
                  fontSize: "16px",
                  backgroundColor: AppColors.surface,
                  color: AppColors.textPrimary,
                  opacity: isLoading ? 0.6 : 1,
                  cursor: isLoading ? "not-allowed" : "auto",
                  transition: "all 300ms ease-out",
                  boxSizing: "border-box",
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
                  display: "block",
                  marginBottom: AppSpacing.sm,
                  ...AppTextStyles.labelLarge,
                  color: AppColors.textPrimary,
                }}
              >
                Password
              </label>
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    padding: `${AppSpacing.md} ${AppSpacing.lg}`,
                    paddingRight: "40px",
                    border: `1px solid ${error ? AppColors.error : AppColors.border}`,
                    borderRadius: "8px",
                    fontSize: "16px",
                    backgroundColor: AppColors.surface,
                    color: AppColors.textPrimary,
                    opacity: isLoading ? 0.6 : 1,
                    cursor: isLoading ? "not-allowed" : "auto",
                    transition: "all 300ms ease-out",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: AppSpacing.lg,
                    background: "none",
                    border: "none",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    color: AppColors.textSecondary,
                    padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: AppSpacing.lg,
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  ...AppTextStyles.bodySmall,
                  color: AppColors.textSecondary,
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  style={{
                    marginRight: AppSpacing.sm,
                    cursor: isLoading ? "not-allowed" : "pointer",
                    width: "18px",
                    height: "18px",
                    accentColor: AppColors.primary,
                  }}
                />
                Keep me signed in today
              </label>
              <button
                type="button"
                onClick={() => router.push("/forgot-password")}
                disabled={isLoading}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  ...AppTextStyles.bodySmall,
                  color: AppColors.primary,
                  cursor: isLoading ? "not-allowed" : "pointer",
                  textDecoration: "none",
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                Forgot password?
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="signin-error"
                style={{
                  padding: AppSpacing.md,
                  border: `1px solid ${AppColors.error}`,
                  borderRadius: "8px",
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
              className="signin-button"
              style={{
                width: "100%",
                padding: `${AppSpacing.md} ${AppSpacing.lg}`,
                backgroundColor: isLoading
                  ? AppColors.disabled
                  : AppColors.primary,
                color: AppColors.surface,
                border: "none",
                borderRadius: "8px",
                ...AppTextStyles.labelLarge,
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1,
                marginBottom: AppSpacing.lg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: AppSpacing.sm,
              }}
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <LogIn size={18} />
              )}
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center space-y-3">
            <div>
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
                onClick={() => router.push("/signup")}
                disabled={isLoading}
                className="signin-link"
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  ...AppTextStyles.bodyMedium,
                  color: AppColors.primary,
                  cursor: isLoading ? "not-allowed" : "pointer",
                  textDecoration: "underline",
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                Create account
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
