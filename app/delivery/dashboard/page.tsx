"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/authContext";
import { getDeliveryOrders, assignOrderToCourier, updateOrderStatus } from "@/lib/services/deliveryService";
import { AppColors } from "@/lib/theme";

export default function DeliveryDashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const deliveryOrders = await getDeliveryOrders(user.uid);
        setOrders(deliveryOrders);
        setError(null);
      } catch (err) {
        setError("Failed to fetch delivery orders");
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  const handleAssign = async (orderId: string) => {
    try {
      await assignOrderToCourier(orderId, user.uid);
      await updateOrderStatus(orderId, "processing");
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, courierId: user.uid, status: "processing" } : o)));
    } catch (e) {
      setError("Failed to assign order");
    }
  };

  if (loading || isLoading) {
    return <div className="p-8 text-center">Loading delivery dashboard...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Delivery Personnel Dashboard</h1>
      <div className="space-y-4">
        {orders.length === 0 && <div className="bg-white p-6 rounded shadow">No orders assigned for delivery.</div>}
        {orders.map((order) => (
          <div key={order.id} className="bg-white p-6 rounded shadow flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-semibold">Order #{order.id}</div>
              <div className="text-sm text-gray-600">To: {order.shippingAddress}</div>
              <div className="text-sm text-gray-600">Status: {order.status}</div>
            </div>
            {!order.courierId && (
              <button
                className="mt-4 md:mt-0 bg-[#0B6B3A] hover:bg-[#095234] text-white font-semibold py-2 px-6 rounded-lg"
                onClick={() => handleAssign(order.id)}
              >
                Assign to Me
              </button>
            )}
            {order.courierId === user.uid && <span className="mt-4 md:mt-0 text-green-700 font-semibold">Assigned to You</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
