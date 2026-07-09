"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useAuth } from "@/lib/auth/authContext";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  Send,
  ShieldCheck,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      await resetPassword(email.trim().toLowerCase());
      setSuccess(true);
      setEmail("");
    } catch (resetError: any) {
      setError(
        resetError?.message ||
          "We could not send the reset email. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md text-center" aria-live="polite">
          <CheckCircle2
            className="mx-auto mb-6 h-14 w-14 text-emerald-700 dark:text-emerald-400"
            aria-hidden="true"
          />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Check Your Email
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            If an NCDF COOP account matches that email, a secure password reset
            link is on its way.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            If you don't see the email in a few minutes, check your spam or junk
            folder.
          </p>
          <Link
            href="/signin"
            className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <style>{`
        .forgot-page-card {
          animation: fadeInUp 0.55s ease-out both;
        }
        .forgot-page-card:hover {
          transform: translateY(-1px);
          transition: transform 220ms ease;
        }
        .forgot-button {
          transition: transform 180ms ease, background-color 180ms ease, box-shadow 180ms ease;
        }
        .forgot-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 14px 30px rgba(22, 74, 46, 0.2);
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Forgot Password?
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <div className="forgot-page-card bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
              <p className="text-red-800 dark:text-red-100 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                htmlFor="forgot-password-email"
                className="block text-sm font-semibold text-gray-900 dark:text-white mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  id="forgot-password-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-gray-900 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 disabled:cursor-wait disabled:opacity-70 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-emerald-950"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`forgot-button flex min-h-12 w-full items-center justify-center gap-2 rounded-lg py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 ${
                loading
                  ? "cursor-wait bg-gray-400 text-white"
                  : "bg-emerald-800 text-white hover:bg-emerald-900"
              }`}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
              {loading ? "Sending secure link..." : "Send Reset Link"}
            </button>
          </form>

          <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400"
              aria-hidden="true"
            />
            <span>
              For your privacy, we show the same confirmation whether or not an
              account exists.
            </span>
          </div>

          <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-6">
            Remember your password?{" "}
            <Link
              href="/signin"
              className="text-blue-600 hover:underline font-semibold"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
