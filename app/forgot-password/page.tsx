'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
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
      setEmail('');
    } catch (resetError: any) {
      setError(resetError?.message || 'We could not send the reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f6f3] px-4 py-12 dark:bg-gray-950">
        <section
          className="reset-panel w-full max-w-md rounded-lg border border-emerald-100 bg-white p-7 text-center shadow-[0_18px_50px_rgba(22,74,46,0.12)] dark:border-gray-700 dark:bg-gray-900 md:p-9"
          aria-live="polite"
        >
          <CheckCircle2
            className="mx-auto mb-5 h-12 w-12 text-emerald-700 dark:text-emerald-400"
            aria-hidden="true"
          />
          <h1 className="mb-3 text-2xl font-bold text-gray-950 dark:text-white">
            Check your inbox
          </h1>
          <p className="mb-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
            If an NCDF COOP account matches that email, a secure password reset link is on its way.
          </p>
          <p className="mb-7 text-sm text-gray-500 dark:text-gray-400">
            Delivery can take a few minutes. Check your spam or junk folder too.
          </p>
          <Link
            href="/signin"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-800 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to sign in
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f6f3] px-4 py-12 dark:bg-gray-950">
      <style>{`
        .reset-panel { animation: fadeInUp 0.55s ease-out both; }
        .reset-button { transition: transform 180ms ease, background-color 180ms ease, box-shadow 180ms ease; }
        .reset-button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 14px 30px rgba(22, 74, 46, 0.2); }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .reset-panel { animation: none; }
          .reset-button { transition: none; }
        }
      `}</style>

      <section className="reset-panel w-full max-w-md rounded-lg border border-emerald-100 bg-white p-7 shadow-[0_18px_50px_rgba(22,74,46,0.12)] dark:border-gray-700 dark:bg-gray-900 md:p-9">
        <div className="mb-7 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <Mail className="h-5 w-5" aria-hidden="true" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-950 dark:text-white">
          Reset your password
        </h1>
        <p className="mb-7 text-sm leading-6 text-gray-600 dark:text-gray-300">
          Enter the email connected to your account. We will send a secure, time-limited reset link.
        </p>

        {error && (
          <div
            className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950"
            role="alert"
          >
            <p className="text-sm text-red-800 dark:text-red-100">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="forgot-password-email"
              className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white"
            >
              Email address
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
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white py-3 pl-10 pr-4 text-gray-900 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-emerald-950"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`reset-button flex min-h-12 w-full items-center justify-center gap-2 rounded-md px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 ${
              loading
                ? 'cursor-wait bg-gray-400 text-white'
                : 'bg-emerald-800 text-white hover:bg-emerald-900'
            }`}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            {loading ? 'Sending secure link...' : 'Send reset link'}
          </button>
        </form>

        <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
          <ShieldCheck
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400"
            aria-hidden="true"
          />
          <span>
            For your privacy, we show the same confirmation whether or not an account exists.
          </span>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Remember your password?{' '}
          <Link
            href="/signin"
            className="font-semibold text-emerald-800 hover:underline dark:text-emerald-400"
          >
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
