"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Store,
  UserPlus,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import SocialSignInButtons from "./SocialSignInButtons";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/authContext";
import { AppColors, AppSpacing, AppTextStyles } from "@/lib/theme";
import { getAuthenticatedLandingPath } from "@/lib/auth/roleRouting";
import { USER_ROLES } from "@/lib/constants/database";

interface SignupRoleOption {
  id: string;
  label: string;
  summary: string;
  Icon: LucideIcon;
}

const SIGNUP_ROLE_OPTIONS: SignupRoleOption[] = [
  {
    id: USER_ROLES.MEMBER,
    label: "Member",
    summary: "Shop with cooperative benefits and rewards.",
    Icon: UserRound,
  },
  {
    id: USER_ROLES.INSTITUTIONAL_BUYER,
    label: "Wholesale Buyer",
    summary: "Buy in bulk with institutional pricing.",
    Icon: Building2,
  },
  {
    id: USER_ROLES.SELLER,
    label: "Seller",
    summary: "Sell products to members and wholesale buyers.",
    Icon: Store,
  },
];

function normalizeSignupRole(value?: string | null): string {
  const normalized = String(value || "")
    .toLowerCase()
    .trim();
  if (normalized === "seller") return USER_ROLES.SELLER;
  if (
    normalized === "wholesale" ||
    normalized === "wholesale_buyer" ||
    normalized === "institutional_buyer" ||
    normalized === "buyer"
  ) {
    return USER_ROLES.INSTITUTIONAL_BUYER;
  }
  return USER_ROLES.MEMBER;
}

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    user,
    loading,
    currentRole,
    roleSelectionComplete,
    signup,
    signInWithGoogle,
    signInWithFacebook,
    signInWithApple,
  } = useAuth();

  const [socialLoading, setSocialLoading] = useState(false);
  const requestedRole = normalizeSignupRole(searchParams.get("type"));
  const [membershipType, setMembershipType] = useState(requestedRole);

  const handleGoogleSignIn = async () => {
    setSocialLoading(true);
    try {
      const destination = await signInWithGoogle(membershipType);
      if (destination) router.replace(destination);
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
    } finally {
      setSocialLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setSocialLoading(true);
    try {
      const destination = await signInWithFacebook(membershipType);
      if (destination) router.replace(destination);
    } catch (err: any) {
      setError(err.message || "Facebook sign-in failed");
    } finally {
      setSocialLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setSocialLoading(true);
    try {
      const destination = await signInWithApple(membershipType);
      if (destination) router.replace(destination);
    } catch (err: any) {
      setError(err.message || "Apple sign-in failed");
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
    setMembershipType(requestedRole);
  }, [requestedRole]);

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

      const destination = await signup(
        email,
        password,
        fullName.trim(),
        membershipType,
      );
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
            Join NCDFCOOP as a{" "}
            <span style={{ fontWeight: 600, color: AppColors.primary }}>
              {SIGNUP_ROLE_OPTIONS.find((role) => role.id === membershipType)
                ?.label || "Member"}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: AppSpacing.sm,
            marginBottom: AppSpacing.lg,
          }}
          aria-label="Choose account role"
        >
          {SIGNUP_ROLE_OPTIONS.map((role) => {
            const selected = membershipType === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setMembershipType(role.id)}
                disabled={isLoading || socialLoading}
                aria-pressed={selected}
                className="transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 motion-reduce:transform-none"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: AppSpacing.md,
                  width: "100%",
                  padding: AppSpacing.md,
                  borderRadius: "8px",
                  border: `1px solid ${selected ? AppColors.primary : AppColors.border}`,
                  backgroundColor: selected
                    ? "rgba(22, 74, 46, 0.08)"
                    : AppColors.surface,
                  color: AppColors.textPrimary,
                  cursor:
                    isLoading || socialLoading ? "not-allowed" : "pointer",
                  textAlign: "left",
                  boxShadow: selected
                    ? "0 8px 24px rgba(22, 74, 46, 0.12)"
                    : "none",
                }}
              >
                <role.Icon
                  size={22}
                  color={selected ? AppColors.primary : AppColors.textSecondary}
                  aria-hidden="true"
                />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      ...AppTextStyles.labelLarge,
                      color: AppColors.textPrimary,
                    }}
                  >
                    {role.label}
                  </span>
                  <span
                    style={{
                      display: "block",
                      ...AppTextStyles.bodySmall,
                      color: AppColors.textSecondary,
                    }}
                  >
                    {role.summary}
                  </span>
                </span>
                {selected && (
                  <CheckCircle2
                    size={19}
                    color={AppColors.primary}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Social Auth Buttons */}
        <SocialSignInButtons
          onGoogleSignIn={handleGoogleSignIn}
          onFacebookSignIn={handleFacebookSignIn}
          onAppleSignIn={handleAppleSignIn}
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
