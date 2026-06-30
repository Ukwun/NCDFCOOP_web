'use client';

export const dynamic = 'force-dynamic';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRealTimeOrders } from '@/lib/hooks/useRealTime';
import { bulkReorder } from '@/lib/services/wholesaleService';

export default function WholesaleOrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { orders: realTimeOrders, isLoading, error } = useRealTimeOrders(user?.uid);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered'>('All');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [notice, setNotice] = useState('');

  const wholesaleOrders = useMemo(
    () => realTimeOrders.filter((order) => order.buyerType === 'wholesale'),
    [realTimeOrders]
  );

  const filteredOrders = useMemo(() => {
    return wholesaleOrders.filter((order) => (filter === 'All' || order.status === filter.toLowerCase())
      && (supplierFilter === 'all' || order.items?.some((item) => item.sellerId === supplierFilter)));
  }, [filter, supplierFilter, wholesaleOrders]);

  const suppliers = useMemo(() => Array.from(new Map(wholesaleOrders.flatMap((order) => order.items || []).filter((item) => item.sellerId).map((item) => [item.sellerId!, item.sellerName || 'Supplier'])).entries()), [wholesaleOrders]);

  const stats = useMemo(() => {
    const totalUnits = wholesaleOrders.reduce(
      (sum, order) => sum + (order.items?.reduce((qty, item) => qty + (item.quantity || 0), 0) || 0),
      0
    );
    const totalAmount = wholesaleOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const nextDeliveryDate = wholesaleOrders
      .map((order) => order.deliveryDate)
      .filter(Boolean)
      .map((date) => (date instanceof Date ? date : new Date(date as any)))
      .sort((a, b) => a.getTime() - b.getTime())[0];

    return {
      totalOrders: wholesaleOrders.length,
      totalUnits,
      totalAmount,
      nextDelivery: nextDeliveryDate ? nextDeliveryDate.toLocaleDateString('en-GB') : '—',
    };
  }, [wholesaleOrders]);

  const reorder = async (order: any) => {
    if (!user) return;
    try { await bulkReorder(user.uid, order); router.push('/cart'); }
    catch (reorderError) { setNotice(reorderError instanceof Error ? reorderError.message : 'Unable to rebuild order.'); }
  };

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
    <ProtectedRoute currentPath="/wholesale/orders" requiredRoles={['institutional_buyer']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">My Bulk Orders</h1>
            <p className="text-gray-600 dark:text-gray-400">Track your wholesale purchases and deliveries</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Orders</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalOrders}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Units</div>
              <div className="text-2xl font-bold text-blue-600">{stats.totalUnits.toLocaleString()}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Order Value</div>
              <div className="text-2xl font-bold text-green-600">₦{stats.totalAmount.toLocaleString()}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Next Delivery</div>
              <div className="text-2xl font-bold text-purple-600">{stats.nextDelivery}</div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab as any)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  filter === tab
                    ? 'bg-purple-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:bg-gray-800"><option value="all">All suppliers</option>{suppliers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
            <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">MOQ checked server-side</span><span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-800">₦{wholesaleOrders.reduce((sum, order) => sum + (order.prepaymentDiscount || 0), 0).toLocaleString()} prepayment savings</span></div>
          </div>
          {notice && <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{notice}</div>}

          {/* Orders Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-gray-600 dark:text-gray-400">Loading orders...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-600 dark:text-red-400">Unable to load orders.</div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-600 dark:text-gray-400">No wholesale orders found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Order No</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Units</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Total Amount</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Delivery</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">{order.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {order.createdAt ? new Date(order.createdAt as any).toLocaleDateString('en-GB') : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                          {order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                          ₦{order.totalAmount?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {order.deliveryDate ? new Date(order.deliveryDate as any).toLocaleDateString('en-GB') : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-3"><button
                            onClick={() => router.push(`/orders/${order.id}`)}
                            className="text-purple-600 hover:text-purple-800 font-semibold"
                          >
                            Track
                          </button><button onClick={() => void reorder(order)} className="font-semibold text-emerald-700 hover:text-emerald-900">Reorder</button></div>
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
            <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-3">Quick Reorder</h3>
            <p className="text-purple-800 dark:text-purple-200 mb-4">
              You're eligible for a 5% bulk discount on your next order of 500+ units!
            </p>
            <button
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded transition-colors"
              onClick={() => router.push('/products')}
            >
              Place New Order
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
