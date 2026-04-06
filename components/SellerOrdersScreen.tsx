'use client';

import React, { useState } from 'react';
import { useSellerOrders } from '@/lib/hooks';
import { orderService } from '@/lib/services/api';
import { ErrorHandler } from '@/lib/error/errorHandler';

interface SellerOrdersScreenProps {
  userId: string;
}

export const SellerOrdersScreen: React.FC<SellerOrdersScreenProps> = ({ userId }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const {
    orders,
    loading,
    error,
    getOrdersByStatus,
    pendingOrders,
    activeOrders,
    completedOrders,
    totalRevenue,
  } = useSellerOrders(userId);

  const filteredOrders =
    filterStatus === 'all'
      ? orders
      : filterStatus === 'pending'
        ? pendingOrders
        : filterStatus === 'active'
          ? activeOrders
          : filterStatus === 'completed'
            ? completedOrders
            : getOrdersByStatus(filterStatus);

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) {
      alert('Please select a new status');
      return;
    }

    try {
      await orderService.updateOrderStatus({
        orderId: selectedOrder,
        status: newStatus as any,
        trackingNumber: trackingNumber || undefined,
        notes: statusNote || undefined,
      });

      setIsStatusModalOpen(false);
      setNewStatus('');
      setTrackingNumber('');
      setStatusNote('');
      setSelectedOrder(null);
    } catch (err) {
      ErrorHandler.logError('UPDATE_STATUS_FAILED', String(err), 'error');
      alert('Failed to update order status');
    }
  };

  const openStatusModal = (orderId: string) => {
    setSelectedOrder(orderId);
    setIsStatusModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
      confirmed: 'bg-blue-50 text-blue-700 border border-blue-200',
      shipped: 'bg-purple-50 text-purple-700 border border-purple-200',
      delivered: 'bg-green-50 text-green-700 border border-green-200',
      cancelled: 'bg-red-50 text-red-700 border border-red-200',
    };
    return colors[status] || 'bg-gray-50 text-gray-700 border border-gray-200';
  };

  const getPaymentBadgeColor = (status: string) => {
    return status === 'paid'
      ? 'bg-green-100 text-green-700'
      : status === 'refunded'
        ? 'bg-red-100 text-red-700'
        : 'bg-gray-100 text-gray-700';
  };

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-semibold">Error loading orders</h3>
        <p className="text-red-700">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold">Orders Management</h1>
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div>
            <p className="text-green-100 text-sm">Total Orders</p>
            <p className="text-2xl font-bold">{orders.length}</p>
          </div>
          <div>
            <p className="text-green-100 text-sm">Pending</p>
            <p className="text-2xl font-bold">{pendingOrders.length}</p>
          </div>
          <div>
            <p className="text-green-100 text-sm">Active</p>
            <p className="text-2xl font-bold">{activeOrders.length}</p>
          </div>
          <div>
            <p className="text-green-100 text-sm">Total Revenue</p>
            <p className="text-2xl font-bold">
              ₦{totalRevenue.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto">
        {[
          { value: 'all', label: 'All Orders' },
          { value: 'pending', label: 'Pending' },
          { value: 'active', label: 'Active' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`px-4 py-2 font-medium whitespace-nowrap transition-colors ${
              filterStatus === tab.value
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-40 rounded-lg" />
          ))}
        </div>
      )}

      {/* Orders List */}
      {!loading && filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order: any) => (
            <div
              key={order.id}
              className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Order Header */}
              <div
                onClick={() =>
                  setExpandedOrderId(expandedOrderId === order.id ? null : order.id)
                }
                className="bg-gray-50 p-4 cursor-pointer flex justify-between items-start"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">Order {order.id.substring(0, 8)}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentBadgeColor(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>Buyer: {order.buyerName}</span>
                    <span>{new Date(order.createdAt?.toDate?.()).toLocaleDateString('en-NG')}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    ₦{order.totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Order Details */}
              {expandedOrderId === order.id && (
                <div className="p-4 border-t space-y-4">
                  {/* Buyer Info */}
                  <div className="bg-blue-50 p-3 rounded">
                    <h4 className="font-semibold text-blue-900 mb-2">Buyer Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-700">Name</p>
                        <p className="font-medium">{order.buyerName}</p>
                      </div>
                      <div>
                        <p className="text-blue-700">Email</p>
                        <p className="font-medium">{order.buyerEmail}</p>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <h4 className="font-semibold mb-2">Items Ordered</h4>
                    <div className="space-y-2">
                      {order.items?.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-2 bg-gray-50 rounded"
                        >
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-semibold">
                            ₦{(item.price * item.quantity).toLocaleString('en-NG')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tracking */}
                  {order.trackingNumber && (
                    <div>
                      <h4 className="font-semibold mb-2">Tracking Number</h4>
                      <p className="font-mono bg-gray-100 p-2 rounded">{order.trackingNumber}</p>
                    </div>
                  )}

                  {/* Notes */}
                  {order.notes && (
                    <div>
                      <h4 className="font-semibold mb-2">Notes</h4>
                      <p className="text-gray-700 p-2 bg-gray-50 rounded">{order.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    {['pending', 'confirmed'].includes(order.status) && (
                      <button
                        onClick={() => openStatusModal(order.id)}
                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Update Status
                      </button>
                    )}
                    <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      Contact Buyer
                    </button>
                    <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      Print Receipt
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Status Update Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Update Order Status</h3>

            {/* Status Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select a status...</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>

            {/* Tracking Number */}
            {newStatus === 'shipped' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g., TRACK123456789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Add any notes about this status update..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!newStatus}
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerOrdersScreen;
