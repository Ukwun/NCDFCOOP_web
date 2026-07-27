"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/authContext";
import { FlutterWaveButton, closePaymentModal } from "flutterwave-react-v3";
import { auth } from "@/lib/firebase/config";
import {
  getMembershipTier,
  normalizeMembershipTier,
} from "@/lib/membership/tiers";
import { useMembershipPricing } from "@/lib/hooks/useMembershipPricing";

function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function isTrustedPaystackCheckout(value?: string): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "checkout.paystack.com" ||
        url.hostname.endsWith(".checkout.paystack.com"))
    );
  } catch {
    return false;
  }
}

export default function MembershipPaymentPage() {
  const { user, loading: authLoading, refreshUserData } = useAuth();
  const userId = user?.uid;
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTier = normalizeMembershipTier(
    searchParams.get("tier") || "bronze",
  );
  const selectedTierDefinition = getMembershipTier(selectedTier);
  const { tiers } = useMembershipPricing();
  const selectedPublicTier = tiers.find((tier) => tier.id === selectedTier);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [authWaitExpired, setAuthWaitExpired] = useState(false);
  const [liveNow, setLiveNow] = useState<string>("--:--:--");
  const [paymentIntent, setPaymentIntent] = useState<{
    reference: string;
    amount: number;
    currency: string;
    membershipTier: string;
    paymentProvider: "paystack" | "flutterwave";
    paymentEnvironment: "test" | "live";
    authorizationUrl?: string;
  } | null>(null);
  const [prepareAttempt, setPrepareAttempt] = useState(0);

  useEffect(() => {
    const tick = () => {
      setLiveNow(
        new Date().toLocaleTimeString("en-NG", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!authLoading) {
      setAuthWaitExpired(false);
      return;
    }
    const timer = window.setTimeout(() => setAuthWaitExpired(true), 12_000);
    return () => window.clearTimeout(timer);
  }, [authLoading]);

  useEffect(() => {
    if (authLoading || !userId) return;

    let cancelled = false;
    const preparePayment = async () => {
      try {
        setLoading(true);
        setError("");
        setPaymentIntent(null);
        const firebaseUser = auth?.currentUser;
        if (!firebaseUser || firebaseUser.uid !== userId) {
          throw new Error(
            "Your secure session is not ready. Refresh the page and sign in again if this continues.",
          );
        }
        const token = await firebaseUser.getIdToken();
        const response = await fetch("/api/membership/intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ tier: selectedTier }),
          signal: AbortSignal.timeout(15_000),
        });
        const payload = (await response.json().catch(() => ({}))) as {
          reference?: string;
          amount?: number;
          currency?: string;
          membershipTier?: string;
          paymentProvider?: "paystack" | "flutterwave";
          paymentEnvironment?: "test" | "live";
          authorizationUrl?: string;
          error?: string;
        };
        if (!response.ok)
          throw new Error(payload?.error || "Payment could not be prepared.");
        if (
          !payload.reference ||
          !payload.amount ||
          !payload.currency ||
          !payload.membershipTier ||
          !payload.paymentProvider ||
          !payload.paymentEnvironment
        ) {
          throw new Error("The membership payment response was incomplete.");
        }
        if (!cancelled) {
          setPaymentIntent({
            reference: payload.reference,
            amount: payload.amount,
            currency: payload.currency,
            membershipTier: payload.membershipTier,
            paymentProvider: payload.paymentProvider,
            paymentEnvironment: payload.paymentEnvironment,
            authorizationUrl: payload.authorizationUrl,
          });
        }
      } catch (intentError: unknown) {
        if (!cancelled) {
          const timedOut =
            intentError instanceof DOMException &&
            (intentError.name === "TimeoutError" || intentError.name === "AbortError");
          setError(
            timedOut
              ? "Payment setup took too long. Check your connection and select Retry secure payment."
              : intentError instanceof Error
              ? intentError.message
              : "Payment could not be prepared.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void preparePayment();
    return () => {
      cancelled = true;
    };
  }, [authLoading, prepareAttempt, selectedTier, userId]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white px-4 py-10">
        <div role="status" className="mx-auto max-w-lg rounded-2xl border border-emerald-100 bg-white p-8 text-center shadow-sm">
          {!authWaitExpired && (
            <span className="mx-auto block h-9 w-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />
          )}
          <h1 className="mt-4 text-xl font-bold text-gray-900">Opening secure membership payment</h1>
          {authWaitExpired && (
            <>
              <p className="mt-3 text-sm font-medium text-amber-800">
                Your account session is taking longer than expected. You do not
                need to remain on this loading screen.
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white"
                >
                  Retry session
                </button>
                <Link
                  href={`/signin?next=${encodeURIComponent(`/membership/payment?tier=${selectedTier}`)}`}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700"
                >
                  Sign in again
                </Link>
              </div>
            </>
          )}
          <p className="mt-2 text-sm text-gray-600">Confirming your signed-in account…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white px-4 py-10">
        <div className="mx-auto max-w-lg rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <Link
              href="/membership"
              className="rounded-full border border-gray-200 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ← Back
            </Link>
            <Link
              href="/inquiries"
              className="rounded-full border border-gray-200 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Help
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Membership Payment
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to securely complete your membership activation.
          </p>

          <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
            {selectedTierDefinition.name} membership:{" "}
            <strong>
              {selectedPublicTier
                ? formatNaira(selectedPublicTier.subscriptionPrice)
                : "Loading current price…"}
            </strong>
          </div>

          <Link
            href={`/signin?next=${encodeURIComponent(`/membership/payment?tier=${selectedTier}`)}`}
            className="mt-6 block w-full rounded-xl bg-emerald-700 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Sign In To Continue
          </Link>
        </div>
      </div>
    );
  }

  const flutterwavePublicKey =
    process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_FLUTTERWAVE_KEY;
  const validFlutterwavePublicKey =
    /^FLWPUBK_(TEST|LIVE)-/i.test(flutterwavePublicKey || "");

  const openPaystackCheckout = () => {
    const authorizationUrl = paymentIntent?.authorizationUrl;
    if (!isTrustedPaystackCheckout(authorizationUrl)) {
      setError(
        "The secure checkout link is invalid. Select Retry secure payment to create a new session.",
      );
      setPaymentIntent(null);
      return;
    }
    window.location.assign(authorizationUrl!);
  };

  const onPaymentSuccess = async (paymentResponse: {
    transaction_id?: string | number;
  }) => {
    setError("");
    setLoading(true);

    try {
      const firebaseUser = auth?.currentUser;
      if (!firebaseUser || firebaseUser.uid !== userId) {
        throw new Error(
          "Your secure session expired. Refresh the page and sign in again.",
        );
      }
      const token = await firebaseUser.getIdToken();
      if (!token || !paymentIntent || !paymentResponse?.transaction_id) {
        throw new Error("Payment verification details are incomplete.");
      }
      const response = await fetch("/api/membership/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transactionId: paymentResponse.transaction_id,
          reference: paymentIntent.reference,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(payload?.error || "Membership verification failed.");

      setSuccess(true);
      await refreshUserData();
      closePaymentModal();
      router.push("/member-benefits");
    } catch (paymentError: unknown) {
      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "Payment was received, but verification is still pending. Contact support with your transaction reference.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-lime-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-xl space-y-5">
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <Link
              href="/membership"
              className="rounded-full border border-gray-200 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
              aria-label="Back to membership"
            >
              ← Back
            </Link>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Live {liveNow}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/inquiries"
                className="rounded-full border border-gray-200 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
                aria-label="Open support chat"
              >
                💬
              </Link>
              <Link
                href="/settings"
                className="rounded-full border border-gray-200 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
                aria-label="Open account settings"
              >
                ⚙️
              </Link>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Complete Membership Payment
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Activate your CoopX member account instantly after successful
            payment.
          </p>

          <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-900">
                  {selectedTierDefinition.name} Membership
                </p>
                <p className="text-xs text-emerald-800">
                  One-time activation · server-locked price
                </p>
              </div>
              <p className="text-xl font-bold text-emerald-900">
                {paymentIntent
                  ? formatNaira(paymentIntent.amount)
                  : selectedPublicTier
                    ? formatNaira(selectedPublicTier.subscriptionPrice)
                    : "—"}
              </p>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
              Membership activated successfully. Redirecting...
            </div>
          ) : null}

          {paymentIntent?.paymentEnvironment === "test" && (
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              Test payment mode is active. Real cards will not be charged.
            </div>
          )}

          {paymentIntent?.paymentProvider === "flutterwave" &&
          !validFlutterwavePublicKey ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Payment is unavailable because the configured checkout key does
              not belong to Flutterwave.
            </div>
          ) : !paymentIntent ? (
            <button
              type="button"
              onClick={() => setPrepareAttempt((attempt) => attempt + 1)}
              disabled={loading}
              className="mt-5 w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:bg-gray-300 disabled:text-gray-600"
            >
              {loading ? "Preparing secure payment…" : "Retry secure payment"}
            </button>
          ) : paymentIntent.paymentProvider === "paystack" ? (
            <button
              type="button"
              onClick={openPaystackCheckout}
              disabled={loading}
              className="mt-5 w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {`Pay ${formatNaira(paymentIntent.amount)} Securely`}
            </button>
          ) : (
            <FlutterWaveButton
              public_key={flutterwavePublicKey}
              tx_ref={paymentIntent.reference}
              amount={paymentIntent.amount}
              currency={paymentIntent.currency}
              payment_options="card,ussd,banktransfer"
              customer={{
                email: user.email || "",
                name: user.displayName || "CoopX Member",
              }}
              customizations={{
                title: "CoopX Membership Payment",
                description: `Activate ${selectedTierDefinition.name} member benefits`,
                logo: "/images/logo/coopx.svg",
              }}
              callback={onPaymentSuccess}
              onClose={() => undefined}
              text={
                loading
                  ? "Processing..."
                  : `Pay ${formatNaira(paymentIntent.amount)} Now`
              }
              disabled={loading}
              className="mt-5 w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
            />
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              href="/membership"
              className="rounded-xl border border-gray-200 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Review Benefits
            </Link>
            <Link
              href="/member-products"
              className="rounded-xl border border-gray-200 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
