"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BadgeDollarSign,
  Boxes,
  LogOut,
  RefreshCw,
  ShoppingBag,
  Users,
  ShieldCheck,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth/authContext";
import { auth } from "@/lib/firebase/config";
import { USER_ROLES } from "@/lib/constants/database";

type Overview = {
  metrics: Record<string, number>;
  recentOrders: Array<{
    id: string;
    status: string;
    total: number;
    buyerEmail: string;
    createdAt: string | null;
    buyerType: string;
    complianceStatus: string | null;
  }>;
  payoutProfiles: Array<{
    sellerId: string;
    accountId: string;
    sellerEmail: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    accountLast4: string;
    reviewStatus: string;
    isDefault: boolean;
  }>;
  pendingProducts: Array<{
    id: string;
    name: string;
    sellerName: string;
    sellerId: string;
    price: number;
    stock: number;
    type: string;
    thumbnail: string;
  }>;
};

export default function AdminPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [revealedPayoutId, setRevealedPayoutId] = useState("");

  const api = useCallback(async (url: string, init?: RequestInit) => {
    const token = await auth?.currentUser?.getIdToken();
    if (!token)
      throw new Error("Your admin session expired. Please sign in again.");
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers || {}),
      },
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Admin operation failed.");
    return result;
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setData(await api("/api/admin/overview"));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load operations.",
      );
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void load();
  }, [load]);

  const reviewPayout = async (
    sellerId: string,
    accountId: string,
    reviewStatus: "verified" | "rejected",
  ) => {
    try {
      setWorkingId(`${sellerId}:${accountId}`);
      setError("");
      await api("/api/admin/payouts", {
        method: "PATCH",
        body: JSON.stringify({ sellerId, accountId, reviewStatus }),
      });
      await load();
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "Unable to review payout profile.",
      );
    } finally {
      setWorkingId("");
    }
  };

  const reviewCompliance = async (
    orderId: string,
    decision: "cleared" | "exception",
  ) => {
    try {
      setWorkingId(orderId);
      setError("");
      await api("/api/admin/orders/compliance", {
        method: "PATCH",
        body: JSON.stringify({ orderId, decision }),
      });
      await load();
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "Unable to review compliance.",
      );
    } finally {
      setWorkingId("");
    }
  };

  const reviewProduct = async (
    productId: string,
    decision: "approve" | "reject",
  ) => {
    const reason =
      decision === "reject"
        ? window.prompt("Tell the seller what must be corrected:")
        : "";
    if (decision === "reject" && (!reason || reason.trim().length < 5)) return;

    try {
      setWorkingId(productId);
      setError("");
      await api("/api/admin/products", {
        method: "PATCH",
        body: JSON.stringify({
          productId,
          decision,
          reason: reason?.trim() || "",
        }),
      });
      await load();
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "Unable to review product.",
      );
    } finally {
      setWorkingId("");
    }
  };

  const cards = data
    ? ([
        ["Users", data.metrics.users, Users],
        ["Products", data.metrics.products, Boxes],
        ["Orders", data.metrics.orders, ShoppingBag],
        ["Transactions", data.metrics.transactions, Activity],
      ] as const)
    : [];

  return (
    <ProtectedRoute
      currentPath="/admin"
      requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]}
    >
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <header className="sticky top-14 z-20 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
                NCDFCOOP Operations
              </p>
              <h1 className="text-xl font-bold sm:text-2xl">
                Admin control centre
              </h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push("/admin/operations")}
                aria-label="Open operations queues"
                className="rounded-xl border border-white/10 p-2.5 transition hover:bg-emerald-500/20"
              >
                <ShieldCheck size={18} />
              </button>
              <button
                onClick={() => void load()}
                aria-label="Refresh operations"
                className="rounded-xl border border-white/10 p-2.5 transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                <RefreshCw
                  className={loading ? "animate-spin" : ""}
                  size={18}
                />
              </button>
              <button
                onClick={async () => {
                  await logout();
                  router.push("/signin");
                }}
                aria-label="Sign out"
                className="rounded-xl border border-white/10 p-2.5 transition hover:bg-rose-500/20"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200"
            >
              {error}
            </div>
          )}
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {cards.map(([label, value, Icon]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-xl transition hover:-translate-y-1 hover:border-emerald-400/30"
              >
                <Icon className="text-emerald-400" size={20} />
                <p className="mt-4 text-2xl font-black">
                  {value.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            ))}
          </section>

          {data && (
            <section className="grid gap-3 sm:grid-cols-3">
              <StatusCard
                label="Live products"
                value={data.metrics.liveProducts}
                tone="emerald"
              />
              <StatusCard
                label="Awaiting review"
                value={data.metrics.pendingProducts}
                tone="amber"
              />
              <StatusCard
                label="Seller drafts"
                value={data.metrics.draftProducts}
                tone="slate"
              />
            </section>
          )}

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div>
                <h2 className="font-bold">Product review queue</h2>
                <p className="text-xs text-slate-400">
                  Unverified sellers require approval before marketplace
                  publication
                </p>
              </div>
              <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300">
                {data?.pendingProducts?.length || 0} waiting
              </span>
            </div>
            <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
              {data?.pendingProducts?.map((product) => (
                <article
                  key={product.id}
                  className="rounded-xl border border-white/10 bg-slate-900/70 p-4 transition hover:-translate-y-0.5 hover:border-amber-400/30"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold">{product.name}</p>
                    <p className="truncate text-xs text-slate-400">
                      {product.sellerName} · {product.type}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-bold">
                      ₦{product.price.toLocaleString()}
                    </span>
                    <span className="text-slate-400">
                      {product.stock.toLocaleString()} in stock
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={workingId === product.id}
                      onClick={() => void reviewProduct(product.id, "approve")}
                      className="min-h-10 rounded-lg bg-emerald-400 px-3 text-xs font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-emerald-300 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={workingId === product.id}
                      onClick={() => void reviewProduct(product.id, "reject")}
                      className="min-h-10 rounded-lg border border-rose-400/30 px-3 text-xs font-black text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))}
              {!loading && !data?.pendingProducts?.length && (
                <p className="p-3 text-sm text-slate-400">
                  No products are waiting for review.
                </p>
              )}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
            <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              <div className="border-b border-white/10 p-4">
                <h2 className="font-bold">Recent orders</h2>
                <p className="text-xs text-slate-400">
                  Live operational order trail
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="text-left text-xs text-slate-400">
                    <tr>
                      <th className="p-4">Order</th>
                      <th>Buyer</th>
                      <th>Status</th>
                      <th>Compliance</th>
                      <th className="pr-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.recentOrders.map((order) => (
                      <tr key={order.id} className="border-t border-white/5">
                        <td className="p-4 font-mono text-xs">
                          {order.id.slice(0, 10)}
                        </td>
                        <td>{order.buyerEmail || "Authenticated buyer"}</td>
                        <td>
                          <span className="rounded-full bg-white/10 px-2 py-1 text-xs capitalize">
                            {order.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td>
                          {order.buyerType === "wholesale" ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs capitalize">
                                {(order.complianceStatus || "pending").replace(
                                  /_/g,
                                  " ",
                                )}
                              </span>
                              {order.complianceStatus !== "cleared" && (
                                <>
                                  <button
                                    disabled={workingId === order.id}
                                    onClick={() =>
                                      void reviewCompliance(order.id, "cleared")
                                    }
                                    className="rounded bg-emerald-500 px-2 py-1 text-[10px] font-bold text-slate-950"
                                  >
                                    Clear
                                  </button>
                                  <button
                                    disabled={workingId === order.id}
                                    onClick={() =>
                                      void reviewCompliance(
                                        order.id,
                                        "exception",
                                      )
                                    }
                                    className="rounded bg-rose-500/20 px-2 py-1 text-[10px] font-bold text-rose-300"
                                  >
                                    Flag
                                  </button>
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">N/A</span>
                          )}
                        </td>
                        <td className="pr-4 text-right font-semibold">
                          ₦{order.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!loading && !data?.recentOrders.length && (
                <p className="p-6 text-sm text-slate-400">
                  No orders have been created yet.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.04]">
              <div className="border-b border-white/10 p-4">
                <h2 className="flex items-center gap-2 font-bold">
                  <BadgeDollarSign className="text-emerald-400" size={19} />
                  Payout accounts
                </h2>
                <p className="text-xs text-slate-400">
                  Verify seller settlement destinations
                </p>
              </div>
              <div className="divide-y divide-white/5">
                {data?.payoutProfiles.map((profile) => (
                  <div key={`${profile.sellerId}:${profile.accountId}`} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {profile.accountName || profile.sellerEmail}
                        </p>
                        <p className="text-xs text-slate-400">
                          {profile.bankName} · {revealedPayoutId === `${profile.sellerId}:${profile.accountId}`
                            ? profile.accountNumber
                            : `••••••${profile.accountLast4}`}
                        </p>
                      </div>
                      <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] capitalize">
                        {profile.reviewStatus.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() =>
                          setRevealedPayoutId((current) =>
                            current === `${profile.sellerId}:${profile.accountId}` ? "" : `${profile.sellerId}:${profile.accountId}`,
                          )
                        }
                        className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-white/10"
                      >
                        {revealedPayoutId === `${profile.sellerId}:${profile.accountId}`
                          ? "Hide account"
                          : "Reveal account"}
                      </button>
                      <button
                        disabled={workingId === `${profile.sellerId}:${profile.accountId}`}
                        onClick={() =>
                          void reviewPayout(profile.sellerId, profile.accountId, "verified")
                        }
                        className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                      >
                        Verify
                      </button>
                      <button
                        disabled={workingId === `${profile.sellerId}:${profile.accountId}`}
                        onClick={() =>
                          void reviewPayout(profile.sellerId, profile.accountId, "rejected")
                        }
                        className="rounded-lg border border-rose-400/30 px-3 py-1.5 text-xs font-bold text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {!loading && !data?.payoutProfiles.length && (
                <p className="p-6 text-sm text-slate-400">
                  No seller payout profiles are awaiting review.
                </p>
              )}
            </section>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

function StatusCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "slate";
}) {
  const tones = {
    emerald: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
    amber: "border-amber-400/20 bg-amber-500/10 text-amber-300",
    slate: "border-white/10 bg-white/5 text-slate-300",
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}
