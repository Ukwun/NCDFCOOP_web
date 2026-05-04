"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/authContext";
import { useRouter } from "next/navigation";
import { getAssignedDeliveries, assignDeliveryToSelf, updateDeliveryStatus } from "@/lib/services/deliveryService";
import { ORDER_STATUS } from "@/lib/constants/database";

export default function DeliveryDashboard() {
  const { user, loading, currentRole } = useAuth();
  const router = useRouter();
  const [deliveries, setDeliveries] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && user) {
      if (currentRole !== "delivery") {
        router.push("/home");
      } else {
        fetchDeliveries();
      }
    }
  }, [user, loading, currentRole]);

  const fetchDeliveries = async () => {
    try {
      const data = await getAssignedDeliveries(user.uid);
      setDeliveries(data);
      setPageLoading(false);
    } catch (err) {
      setError("Failed to load deliveries");
      setPageLoading(false);
    }
  };

  const handleAssign = async (orderId) => {
    await assignDeliveryToSelf(user.uid, orderId);
    fetchDeliveries();
  };

  const handleStatusUpdate = async (orderId, status) => {
    await updateDeliveryStatus(orderId, status);
    fetchDeliveries();
  };

  if (pageLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Delivery Personnel Dashboard</h1>
      <div className="space-y-4">
        {deliveries.length === 0 && <div>No deliveries assigned yet.</div>}
        {deliveries.map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
            <div>
              <span className="font-semibold">Order #{order.id}</span> - <span>{order.status}</span>
            </div>
            <div>Address: {order.shippingAddress}</div>
            <div>Buyer: {order.userId}</div>
            <div>
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded mr-2"
                onClick={() => handleStatusUpdate(order.id, ORDER_STATUS.SHIPPED)}
                disabled={order.status === ORDER_STATUS.SHIPPED || order.status === ORDER_STATUS.DELIVERED}
              >
                Mark as Shipped
              </button>
              <button
                className="bg-green-600 text-white px-3 py-1 rounded"
                onClick={() => handleStatusUpdate(order.id, ORDER_STATUS.DELIVERED)}
                disabled={order.status === ORDER_STATUS.DELIVERED}
              >
                Mark as Delivered
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
