"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownToLine,
  Building2,
  CheckCircle2,
  Clock3,
  Landmark,
  Loader2,
  RefreshCw,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth/authContext";
import { USER_ROLES } from "@/lib/constants/database";
import { auth } from "@/lib/firebase/config";

type Balance = {
  available: number;
  pendingPayout: number;
  lifetimeEarned: number;
  lifetimePaid: number;
  held: number;
};

type PayoutAccount = {
  id: string;
  bankName: string;
  accountName: string;
  accountLast4: string;
  reviewStatus: "pending_verification" | "verified" | "rejected";
};

type PayoutRequest = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
  paidAt?: string | null;
  externalReference?: string;
  rejectionReason?: string;
  payoutProfileSnapshot?: {
    bankName?: string;
    accountName?: string;
    accountLast4?: string;
  };
};

const EMPTY_BALANCE: Balance = {
  available: 0,
  pendingPayout: 0,
  lifetimeEarned: 0,
  lifetimePaid: 0,
  held: 0,
};

const STATUS_LABELS: Record<string, string> = {
  pending_approval: "Awaiting approval",
  exception_review: "Under enhanced review",
  approved: "Approved",
  processing: "Bank transfer in progress",
  paid: "Paid",
  rejected: "Rejected",
};

function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return "Recently";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Recently"
    : new Intl.DateTimeFormat("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function statusClasses(status: string) {
  if (status === "paid") return "bg-emerald-100 text-emerald-800";
  if (status === "rejected") return "bg-rose-100 text-rose-800";
  if (status === "processing" || status === "approved")
    return "bg-blue-100 text-blue-800";
  return "bg-amber-100 text-amber-900";
}

export default function SellerWithdrawalsPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<Balance>(EMPTY_BALANCE);
  const [accounts, setAccounts] = useState<PayoutAccount[]>([]);
  const [defaultAccountId, setDefaultAccountId] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const verifiedAccounts = useMemo(
    () => accounts.filter((account) => account.reviewStatus === "verified"),
    [accounts],
  );

  const call = useCallback(async (url: string, init?: RequestInit) => {
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser) {
      throw new Error("Your session expired. Sign in again to continue.");
    }
    const token = await firebaseUser.getIdToken();
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        result.error || "Your withdrawal information could not be updated.",
      );
    }
    return result;
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [balanceResult, profileResult, requestResult] = await Promise.all([
        call("/api/seller/balance"),
        call("/api/seller/payout-profile"),
        call("/api/payout-requests"),
      ]);
      const nextAccounts = Array.isArray(profileResult?.profile?.accounts)
        ? profileResult.profile.accounts
        : [];
      const nextVerified = nextAccounts.filter(
        (account: PayoutAccount) => account.reviewStatus === "verified",
      );
      const preferredId = nextVerified.some(
        (account: PayoutAccount) =>
          account.id === profileResult?.profile?.defaultAccountId,
      )
        ? profileResult.profile.defaultAccountId
        : nextVerified[0]?.id || "";

      setBalance(balanceResult?.balance || EMPTY_BALANCE);
      setAccounts(nextAccounts);
      setDefaultAccountId(profileResult?.profile?.defaultAccountId || "");
      setSelectedAccountId((current) =>
        nextVerified.some((account: PayoutAccount) => account.id === current)
          ? current
          : preferredId,
      );
      setRequests(
        Array.isArray(requestResult?.requests) ? requestResult.requests : [],
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Your withdrawal centre could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => {
    if (user?.uid) void load();
  }, [load, user?.uid]);

  async function submitWithdrawal() {
    const requestedAmount = Math.round(Number(amount) * 100) / 100;
    setError("");
    setNotice("");

    if (!selectedAccountId) {
      setError("Select a verified bank account for this withdrawal.");
      return;
    }
    if (!Number.isFinite(requestedAmount) || requestedAmount < 1000) {
      setError("The minimum withdrawal amount is ₦1,000.");
      return;
    }
    if (requestedAmount > balance.available) {
      setError(
        `You can currently withdraw up to ${formatNaira(balance.available)}.`,
      );
      return;
    }

    try {
      setSubmitting(true);
      const result = await call("/api/payout-requests", {
        method: "POST",
        body: JSON.stringify({
          amount: requestedAmount,
          accountId: selectedAccountId,
        }),
      });
      setAmount("");
      setNotice(
        result.status === "exception_review"
          ? "Withdrawal submitted for enhanced finance review."
          : "Withdrawal submitted. An administrator can now review it.",
      );
      await load();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Your withdrawal request could not be submitted.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProtectedRoute
      currentPath="/seller/withdrawals"
      requiredRoles={[USER_ROLES.SELLER]}
    >
      <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-6 sm:py-9">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 p-6 text-white shadow-xl sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">
                  Seller settlements
                </p>
                <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                  Withdraw your earnings
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-emerald-100">
                  Request funds earned from completed, paid orders and track
                  every approval and bank transfer.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void load()}
                disabled={loading}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-bold transition hover:-translate-y-0.5 hover:bg-white/15 disabled:opacity-60"
              >
                <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
                Refresh balances
              </button>
            </div>
          </header>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
            >
              {error}
            </div>
          )}
          {notice && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
            >
              <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
              {notice}
            </div>
          )}

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <BalanceCard
              label="Available to withdraw"
              value={balance.available}
              icon={<ArrowDownToLine size={20} />}
              accent
            />
            <BalanceCard
              label="Awaiting payout"
              value={balance.pendingPayout}
              icon={<Clock3 size={20} />}
            />
            <BalanceCard
              label="Lifetime earned"
              value={balance.lifetimeEarned}
              icon={<WalletCards size={20} />}
            />
            <BalanceCard
              label="Lifetime paid"
              value={balance.lifetimePaid}
              icon={<CheckCircle2 size={20} />}
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-emerald-100 p-2.5 text-emerald-800">
                  <Landmark size={21} />
                </span>
                <div>
                  <h2 className="text-lg font-black">New withdrawal request</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Your amount is reserved immediately and cannot be requested
                    twice.
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="grid min-h-52 place-items-center">
                  <Loader2 className="animate-spin text-emerald-700" />
                </div>
              ) : verifiedAccounts.length === 0 ? (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                  <p className="font-bold">
                    {accounts.length
                      ? "Your bank accounts are awaiting administrator verification."
                      : "Add a bank account before requesting a withdrawal."}
                  </p>
                  <p className="mt-1 text-amber-800">
                    Only verified accounts can receive seller funds.
                  </p>
                  <Link
                    href="/seller/payout-profile"
                    className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-amber-900 px-4 font-bold text-white"
                  >
                    Manage bank accounts
                  </Link>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-bold">
                      Pay into
                    </span>
                    <select
                      value={selectedAccountId}
                      onChange={(event) =>
                        setSelectedAccountId(event.target.value)
                      }
                      className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                    >
                      {verifiedAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.bankName} · ••••{account.accountLast4} ·{" "}
                          {account.accountName}
                          {account.id === defaultAccountId ? " (default)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 flex items-center justify-between gap-3 text-sm font-bold">
                      Amount
                      <button
                        type="button"
                        onClick={() => setAmount(String(balance.available))}
                        disabled={balance.available < 1000}
                        className="text-xs text-emerald-700 underline disabled:text-slate-400"
                      >
                        Withdraw maximum
                      </button>
                    </span>
                    <div className="flex min-h-12 overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/15">
                      <span className="grid w-12 place-items-center border-r border-slate-200 font-black text-slate-600">
                        ₦
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="1000"
                        max={balance.available}
                        step="100"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        placeholder="Minimum ₦1,000"
                        className="min-w-0 flex-1 px-3 text-slate-950 outline-none"
                      />
                    </div>
                  </label>
                  <button
                    type="button"
                    onClick={() => void submitWithdrawal()}
                    disabled={
                      submitting ||
                      !selectedAccountId ||
                      balance.available < 1000
                    }
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                  >
                    {submitting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <ShieldCheck size={18} />
                    )}
                    {submitting
                      ? "Submitting securely…"
                      : "Request withdrawal"}
                  </button>
                  {balance.available < 1000 && (
                    <p className="text-center text-xs text-slate-500">
                      Your available balance must reach ₦1,000 before you can
                      submit a withdrawal.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-blue-100 p-2.5 text-blue-800">
                  <Building2 size={21} />
                </span>
                <div>
                  <h2 className="text-lg font-black">How payout works</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    A controlled settlement trail protects your earnings.
                  </p>
                </div>
              </div>
              <ol className="mt-5 space-y-4">
                {[
                  [
                    "1",
                    "Submit",
                    "Choose a verified account and request any amount within your available balance.",
                  ],
                  [
                    "2",
                    "Approval",
                    "Finance, an administrator, or the super administrator reviews the request.",
                  ],
                  [
                    "3",
                    "Bank transfer",
                    "The approved amount is transferred to the exact bank account captured with your request.",
                  ],
                  [
                    "4",
                    "Paid",
                    "The transfer reference is recorded and your lifetime paid total updates.",
                  ],
                ].map(([step, title, copy]) => (
                  <li key={step} className="flex gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-black text-white dark:bg-white dark:text-slate-950">
                      {step}
                    </span>
                    <div>
                      <p className="font-bold">{title}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {copy}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="border-b border-slate-200 p-5 dark:border-white/10 sm:p-6">
              <h2 className="text-lg font-black">Withdrawal history</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Live status for every request made from this seller account.
              </p>
            </div>
            {loading ? (
              <div className="grid min-h-36 place-items-center">
                <Loader2 className="animate-spin text-emerald-700" />
              </div>
            ) : requests.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                No withdrawal requests yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/10">
                {requests.map((request) => (
                  <article
                    key={request.id}
                    className="grid gap-3 p-5 transition hover:bg-slate-50 dark:hover:bg-white/[0.03] sm:grid-cols-[1fr_auto] sm:items-center sm:p-6"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-black">
                          {formatNaira(Number(request.amount || 0))}
                        </p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-black ${statusClasses(request.status)}`}
                        >
                          {STATUS_LABELS[request.status] ||
                            request.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {request.payoutProfileSnapshot?.bankName || "Bank"} ·
                        ••••{request.payoutProfileSnapshot?.accountLast4 || ""}{" "}
                        · Requested {formatDate(request.createdAt)}
                      </p>
                      {request.rejectionReason && (
                        <p className="mt-2 text-sm text-rose-700">
                          {request.rejectionReason}
                        </p>
                      )}
                    </div>
                    <div className="text-left text-xs text-slate-500 sm:text-right">
                      {request.status === "paid" ? (
                        <>
                          <p className="font-bold text-emerald-700">
                            Paid {formatDate(request.paidAt)}
                          </p>
                          {request.externalReference && (
                            <p>Reference: {request.externalReference}</p>
                          )}
                        </>
                      ) : (
                        <p>Updated {formatDate(request.updatedAt)}</p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}

function BalanceCard({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${
        accent
          ? "border-emerald-700 bg-emerald-700 text-white"
          : "border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900"
      }`}
    >
      <div
        className={`mb-4 grid h-9 w-9 place-items-center rounded-xl ${
          accent
            ? "bg-white/15"
            : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200"
        }`}
      >
        {icon}
      </div>
      <p
        className={`text-xs font-bold ${
          accent ? "text-emerald-100" : "text-slate-500"
        }`}
      >
        {label}
      </p>
      <p className="mt-1 break-words text-lg font-black sm:text-2xl">
        {formatNaira(value)}
      </p>
    </article>
  );
}
