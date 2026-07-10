"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, ShieldCheck, UserPlus } from "lucide-react";
import {
  AppColors,
  AppSpacing,
  AppTextStyles,
  AnimationTiming,
} from "@/lib/theme";

export default function WelcomeScreen() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<"signin" | "signup" | null>(
    null,
  );

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    router.prefetch("/signup");
    router.prefetch("/signin");
  }, [router]);

  const navigate = (target: "signin" | "signup") => {
    setNavigatingTo(target);
    router.push(target === "signup" ? "/signup" : "/signin");
  };

  return (
    <>
      <style>{`
        ${
          isVisible
            ? `
          @keyframes welcomeFadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .welcome-fade-in {
            animation: welcomeFadeIn ${AnimationTiming.normal}ms ease-out forwards;
          }
        `
            : ""
        }
      `}</style>

      <div
        className={`flex min-h-screen items-center justify-center px-6 py-12 ${
          isVisible ? "welcome-fade-in" : "opacity-0"
        }`}
        style={{ backgroundColor: AppColors.background }}
      >
        <main className="w-full max-w-md text-center">
          <div
            className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full"
            style={{
              backgroundColor: "rgba(22, 74, 46, 0.08)",
              color: AppColors.primary,
            }}
          >
            <ShieldCheck size={26} aria-hidden="true" />
          </div>

          <h1
            style={{
              ...AppTextStyles.h1,
              color: AppColors.textPrimary,
              marginBottom: AppSpacing.md,
            }}
          >
            Welcome to NCDFCOOP
          </h1>

          <p
            style={{
              ...AppTextStyles.bodyLarge,
              color: AppColors.textSecondary,
              marginBottom: AppSpacing.xxl,
            }}
          >
            Sign in or create your secure account. You will choose your role
            after authentication.
          </p>

          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => navigate("signup")}
              disabled={!!navigatingTo}
              className="flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 py-3 font-semibold transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-70 motion-reduce:transform-none"
              style={{
                backgroundColor: AppColors.primary,
                color: AppColors.surface,
              }}
            >
              <UserPlus size={18} aria-hidden="true" />
              {navigatingTo === "signup" ? "Opening..." : "Create Account"}
            </button>

            <button
              type="button"
              onClick={() => navigate("signin")}
              disabled={!!navigatingTo}
              className="flex min-h-12 items-center justify-center gap-2 rounded-lg border px-5 py-3 font-semibold transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-70 motion-reduce:transform-none"
              style={{
                borderColor: AppColors.border,
                backgroundColor: AppColors.surface,
                color: AppColors.textPrimary,
              }}
            >
              <LogIn size={18} aria-hidden="true" />
              {navigatingTo === "signin" ? "Opening..." : "Sign In"}
            </button>
          </div>
        </main>
      </div>
    </>
  );
}
