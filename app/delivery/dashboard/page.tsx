"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/authContext";
import { getDeliveryOrders, assignOrderToCourier, updateOrderStatus } from "@/lib/services/deliveryService";

interface DeliveryOrder {
  id: string;
  shippingAddress?: string;
  status?: string;
  courierId?: string;
}

type HealthTone = "network" | "backend" | "warning";

interface HealthIssue {
  tone: HealthTone;
  message: string;
}

function classifyHealthIssue(err: unknown, online: boolean): HealthIssue {
  const raw = typeof err === "object" && err && "message" in err ? String((err as { message?: unknown }).message || "") : "";
  const message = raw.toLowerCase();

  if (!online || message.includes("network") || message.includes("offline") || message.includes("failed to fetch")) {
    return {
      tone: "network",
      message: "Network connectivity issue detected. Live delivery sync will resume automatically when connection is stable.",
    };
  }

  if (message.includes("permission")) {
    return {
      tone: "backend",
      message: "Backend permission restrictions are blocking delivery data. Contact support to restore access for this account.",
    };
  }

  if (message.includes("index")) {
    return {
      tone: "warning",
      message: "Backend indexes are still updating. Some live delivery aggregates may be temporarily unavailable.",
    };
  }

  return {
    tone: "warning",
    message: "Delivery service is temporarily delayed. You can retry sync while core navigation remains available.",
  };
}

export default function DeliveryDashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [healthIssue, setHealthIssue] = useState<HealthIssue | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(window.navigator.onLine);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const fetchOrders = useCallback(
    async (refreshMode = false) => {
      if (!user) return;

      if (refreshMode) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const deliveryOrders = (await getDeliveryOrders(user.uid)) as DeliveryOrder[];
        setOrders(deliveryOrders);
        setError(null);
        setHealthIssue(null);
      } catch (err) {
        const issue = classifyHealthIssue(err, isOnline);
        setHealthIssue(issue);
        setError(issue.message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isOnline, user]
  );

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
      return;
    }

    if (!user) return;
    fetchOrders(false);
  }, [fetchOrders, loading, router, user]);

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchOrders(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchOrders, user]);

  const stats = useMemo(() => {
    const assignedToMe = orders.filter((o) => o.courierId === user?.uid).length;
    const inTransit = orders.filter((o) => o.status === "processing" || o.status === "shipped").length;
    const delivered = orders.filter((o) => o.status === "delivered").length;

    return {
      total: orders.length,
      assignedToMe,
      inTransit,
      delivered,
    };
  }, [orders, user?.uid]);

  const handleAssign = async (orderId: string) => {
    if (!user) return;

    try {
      setAssigningOrderId(orderId);
      await assignOrderToCourier(orderId, user.uid);
      await updateOrderStatus(orderId, "processing");
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, courierId: user.uid, status: "processing" } : o)));
    } catch {
      setError("Failed to assign this order. Please retry.");
    } finally {
      setAssigningOrderId(null);
    }
  };

  const openOrders = () => {
    router.push("/wholesale/orders");
  };

  const statusClasses = (status?: string) => {
    if (status === "delivered") return "bg-green-100 text-green-800";
    if (status === "shipped") return "bg-blue-100 text-blue-800";
    if (status === "processing") return "bg-indigo-100 text-indigo-800";
    if (status === "cancelled") return "bg-red-100 text-red-800";
    return "bg-amber-100 text-amber-800";
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F7FA] px-4 py-8">
        <div className="mx-auto max-w-4xl animate-pulse space-y-4">
          <div className="h-24 rounded-2xl bg-white" />
          <div className="h-20 rounded-2xl bg-white" />
          <div className="h-32 rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  if (error) {
    const toneClass =
      healthIssue?.tone === "network"
        ? "border-amber-200"
        : healthIssue?.tone === "backend"
        ? "border-red-200"
        : "border-[#B6DCC6]";

    return (
      <div className="min-h-screen bg-[#F4F7FA] px-4 py-8">
        <div className={`mx-auto max-w-2xl rounded-2xl border bg-white p-6 shadow-sm ${toneClass}`}>
          <h1 className="text-xl font-bold text-red-700">Delivery dashboard is temporarily unavailable</h1>
          <p className="mt-2 text-sm text-gray-700">{error}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              onClick={() => fetchOrders(false)}
            >
              Retry Sync
            </button>
            <button
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              onClick={() => router.push("/wholesale/profile")}
            >
              Back to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FA] px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <section className="rounded-2xl bg-gradient-to-r from-[#164A2E] to-[#2A9B61] p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Delivery Operations</h1>
              <p className="mt-1 text-sm text-white/90">Live assignment queue and order delivery tracking.</p>
            </div>
            <button
              className="rounded-lg bg-white/20 px-3 py-2 text-xs font-semibold hover:bg-white/30"
              onClick={() => fetchOrders(true)}
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total" value={String(stats.total)} />
          <StatCard label="Assigned" value={String(stats.assignedToMe)} />
          <StatCard label="In Transit" value={String(stats.inTransit)} />
          <StatCard label="Delivered" value={String(stats.delivered)} />
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Order Queue</h2>
            <button
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              onClick={openOrders}
            >
              Open Wholesale Orders
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center">
              <p className="text-sm text-gray-600">No orders available for delivery assignment yet.</p>
              <button
                className="mt-3 rounded-lg bg-[#164A2E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#103821]"
                onClick={() => fetchOrders(false)}
              >
                Check Again
              </button>
            </div>
          ) : null}

          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Order #{order.id}</p>
                    <p className="text-sm text-gray-600">To: {order.shippingAddress || "Address pending"}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(order.status)}`}>
                    {order.status || "pending"}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {!order.courierId ? (
                    <button
                      className="rounded-lg bg-[#0B6B3A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#095234] disabled:cursor-not-allowed disabled:bg-gray-400"
                      onClick={() => handleAssign(order.id)}
                      disabled={assigningOrderId === order.id}
                    >
                      {assigningOrderId === order.id ? "Assigning..." : "Assign to Me"}
                    </button>
                  ) : null}

                  {order.courierId === user?.uid ? (
                    <button
                      className="rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700"
                      onClick={openOrders}
                    >
                      Assigned to You
                    </button>
                  ) : null}

                  <button
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    onClick={openOrders}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}
