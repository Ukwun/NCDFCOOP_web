"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import SocialSignInButtons from "./SocialSignInButtons";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/authContext";
import { AppColors, AppSpacing, AppTextStyles } from "@/lib/theme";
import { getAuthenticatedLandingPath } from "@/lib/auth/roleRouting";

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = String(searchParams.get("ref") || "").trim().toUpperCase();
  const {
    user,
    loading,
    currentRole,
    roleSelectionComplete,
    signup,
    signInWithGoogle,
  } = useAuth();

  const [socialLoading, setSocialLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setSocialLoading(true);
    try {
      const destination = await signInWithGoogle(referralCode);
      if (destination) router.replace(destination);
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
    } finally {
      setSocialLoading(false);
    }
  };

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && user && !isLoading && !socialLoading) {
      router.replace(
        getAuthenticatedLandingPath(currentRole, roleSelectionComplete),
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
  ]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Validation
      if (!fullName.trim() || !email || !password || !confirmPassword) {
        setError("Please fill in all fields");
        setIsLoading(false);
        return;
      }

      if (fullName.trim().length < 2) {
        setError("Please enter your full name");
        setIsLoading(false);
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("Please enter a valid email address");
        setIsLoading(false);
        return;
      }

      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        setIsLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setIsLoading(false);
        return;
      }

      if (!agreeToTerms) {
        setError("Please agree to the terms and conditions");
        setIsLoading(false);
        return;
      }

      const destination = await signup(email, password, fullName.trim(), undefined, referralCode);
      router.replace(destination);
    } catch (err: any) {
      console.error("Signup error:", err);

      // Provide better error messages
      let errorMessage = "Failed to create account. Please try again.";

      if (err.code === "auth/network-request-failed") {
        errorMessage =
          "Network connection failed. Please check your internet and try again.";
      } else if (err.code === "auth/email-already-in-use") {
        errorMessage =
          "This email is already registered. Please log in or use a different email.";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Use at least 8 characters.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (err.code === "auth/operation-not-allowed") {
        errorMessage = "Account creation is not currently enabled.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: AppColors.background }}
    >
      <div className="w-full px-6" style={{ maxWidth: "400px" }}>
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
            Create your secure account. You will choose your role after sign up.
          </div>
          {referralCode && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">Referral code {referralCode} will be verified when your account is created.</div>}
        </div>

        {/* Social Auth Buttons */}
        <SocialSignInButtons
          onGoogleSignIn={handleGoogleSignIn}
          isLoading={socialLoading}
        />

        {/* Divider */}
        <div
          style={{
            textAlign: "center",
            margin: "16px 0",
            color: AppColors.textSecondary,
          }}
        >
          or
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Full Name Field */}
          <div style={{ marginBottom: AppSpacing.lg }}>
            <label
              htmlFor="signup-full-name"
              style={{
                display: "block",
                marginBottom: AppSpacing.sm,
                ...AppTextStyles.labelLarge,
                color: AppColors.textPrimary,
              }}
            >
              Full Name
            </label>
            <input
              id="signup-full-name"
              name="name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Your full name"
              disabled={isLoading}
              maxLength={100}
              required
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
              name="email"
              autoComplete="email"
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
                name="password"
                autoComplete="new-password"
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

          {/* Confirm Password Field */}
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
              Confirm Password
            </label>
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
                aria-label={
                  showConfirmPassword
                    ? "Hide confirmation password"
                    : "Show confirmation password"
                }
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
                {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          {/* Terms & Conditions */}
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              ...AppTextStyles.bodySmall,
              color: AppColors.textSecondary,
              cursor: isLoading ? "not-allowed" : "pointer",
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
                marginTop: "2px",
                cursor: isLoading ? "not-allowed" : "pointer",
                width: "18px",
                height: "18px",
                accentColor: AppColors.primary,
                flexShrink: 0,
              }}
            />
            <span>
              I agree to the{" "}
              <Link
                href="/terms"
                style={{
                  color: AppColors.primary,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Terms & Conditions
              </Link>
              {" and "}
              <Link
                href="/privacy"
                style={{
                  color: AppColors.primary,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Privacy Policy
              </Link>
            </span>
          </label>

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: AppSpacing.md,
                backgroundColor: `${AppColors.error}20`,
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

          {/* Sign Up Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: `${AppSpacing.md} ${AppSpacing.lg}`,
              backgroundColor: isLoading
                ? AppColors.textDisabled
                : AppColors.primary,
              color: AppColors.surface,
              border: "none",
              borderRadius: "8px",
              ...AppTextStyles.labelLarge,
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.7 : 1,
              transition: "all 300ms ease-out",
              marginBottom: AppSpacing.lg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: AppSpacing.sm,
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
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <UserPlus size={18} />
            )}
            {isLoading ? "Creating account..." : "Create Account"}
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
            onClick={() => router.push("/signin")}
            disabled={isLoading}
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
