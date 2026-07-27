"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, RotateCcw, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth/authContext";
import { auth } from "@/lib/firebase/config";

export default function MembershipPaymentCallbackPage() {
  const { user, loading: authLoading, refreshUserData } = useAuth();
  const userId = user?.uid;
  const refreshUserDataRef = useRef(refreshUserData);
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference =
    searchParams.get("reference") || searchParams.get("trxref") || "";
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying",
  );
  const [message, setMessage] = useState("Confirming your payment securely…");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    refreshUserDataRef.current = refreshUserData;
  }, [refreshUserData]);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setStatus("error");
      setMessage(
        "Your payment returned successfully, but your sign-in session is unavailable. Sign in again, then retry verification.",
      );
      return;
    }
    if (!reference) {
      setStatus("error");
      setMessage("The payment provider did not return a transaction reference.");
      return;
    }

    let cancelled = false;
    const verify = async () => {
      try {
        setStatus("verifying");
        setMessage("Confirming your payment securely…");
        const firebaseUser = auth?.currentUser;
        if (!firebaseUser || firebaseUser.uid !== userId) {
          throw new Error(
            "Your secure session is not ready. Sign in again and retry verification.",
          );
        }
        const token = await firebaseUser.getIdToken();
        const response = await fetch("/api/membership/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reference }),
          signal: AbortSignal.timeout(20_000),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            payload.error ||
              "The payment has not been confirmed yet. You can retry safely.",
          );
        }
        if (cancelled) return;
        setStatus("success");
        setMessage("Membership activated successfully.");
        await refreshUserDataRef.current();
        window.setTimeout(() => router.replace("/member-benefits"), 1200);
      } catch (verificationError) {
        if (cancelled) return;
        setStatus("error");
        setMessage(
          verificationError instanceof Error
            ? verificationError.message
            : "Payment verification could not be completed.",
        );
      }
    };
    void verify();
    return () => {
      cancelled = true;
    };
  }, [attempt, authLoading, reference, router, userId]);

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-emerald-50 via-white to-lime-50 px-4 py-10">
      <section className="w-full max-w-lg rounded-3xl border border-emerald-100 bg-white p-7 text-center shadow-xl sm:p-9">
        {status === "verifying" ? (
          <Loader2
            className="mx-auto animate-spin text-emerald-700"
            size={42}
          />
        ) : status === "success" ? (
          <CheckCircle2 className="mx-auto text-emerald-700" size={46} />
        ) : (
          <ShieldAlert className="mx-auto text-amber-700" size={46} />
        )}
        <h1 className="mt-5 text-2xl font-black text-slate-950">
          {status === "verifying"
            ? "Verifying membership payment"
            : status === "success"
              ? "Payment confirmed"
              : "Verification needs attention"}
        </h1>
        <p
          role={status === "error" ? "alert" : "status"}
          className="mt-3 text-sm leading-6 text-slate-600"
        >
          {message}
        </p>
        {status === "error" && (
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white"
            >
              <RotateCcw size={17} /> Retry verification
            </button>
            <Link
              href={`/signin?next=${encodeURIComponent(`/membership/payment/callback?reference=${reference}`)}`}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700"
            >
              Sign in again
            </Link>
          </div>
        )}
        <p className="mt-6 break-all text-xs text-slate-400">
          Reference: {reference || "Not supplied"}
        </p>
      </section>
    </main>
  );
}
