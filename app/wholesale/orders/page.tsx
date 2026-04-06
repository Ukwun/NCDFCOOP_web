'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/authContext';
import ProtectedRoute from '@/components/ProtectedRoute';

interface BulkOrder {
  id: string;
  orderNo: string;
  date: string;
  items: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  deliveryDate?: string;
}

export default function WholesaleOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<BulkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching wholesale buyer orders
    setTimeout(() => {
      setOrders([
        {
          id: '1',
          orderNo: 'BULK-2024-001',
          date: '2024-04-05',
          items: 500,
          totalAmount: 450000,
          status: 'delivered',
          deliveryDate: '2024-04-06',
        },
        {
          id: '2',
          orderNo: 'BULK-2024-002',
          date: '2024-04-03',
          items: 300,
          totalAmount: 225000,
          status: 'shipped',
        },
        {
          id: '3',
          orderNo: 'BULK-2024-003',
          date: '2024-04-06',
          items: 750,
          totalAmount: 562500,
          status: 'confirmed',
        },
        {
          id: '4',
          orderNo: 'BULK-2024-004',
          date: '2024-04-06',
          items: 1000,
          totalAmount: 625000,
          status: 'pending',
        },
      ]);
      setIsLoading(false);
    }, 500);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ProtectedRoute currentPath="/wholesale/orders">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              My Bulk Orders
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your wholesale purchases and deliveries
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Orders</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">12</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Units Ordered</div>
              <div className="text-2xl font-bold text-blue-600">8,500</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Savings</div>
              <div className="text-2xl font-bold text-green-600">₦425,000</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Next Delivery</div>
              <div className="text-2xl font-bold text-purple-600">Apr 10</div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered'].map((filter) => (
              <button
                key={filter}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  filter === 'All'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Orders Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                Loading orders...
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                No bulk orders found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Order No
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Units
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Delivery
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                          {order.orderNo}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {order.date}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                          {order.items.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                          ₦{order.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {order.deliveryDate || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button className="text-purple-600 hover:text-purple-800 font-semibold">
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Reorder Suggestion */}
          <div className="mt-8 bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-3">
              Quick Reorder
            </h3>
            <p className="text-purple-800 dark:text-purple-200 mb-4">
              You're eligible for a 5% bulk discount on your next order of 500+ units!
            </p>
            <button className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded transition-colors">
              Place New Order
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
