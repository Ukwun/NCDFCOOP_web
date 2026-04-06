'use client';

import React, { useState } from 'react';
import { useBuyerOrders } from '@/lib/hooks';
import { orderService } from '@/lib/services/api';
import { ErrorHandler } from '@/lib/error/errorHandler';

interface BuyerOrdersScreenProps {
  userId: string;
}

export const BuyerOrdersScreen: React.FC<BuyerOrdersScreenProps> = ({ userId }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');

  const {
    orders,
    loading,
    error,
    getOrdersByStatus,
    activeOrders,
    completedOrders,
    totalSpent,
  } = useBuyerOrders(userId);

  const filteredOrders =
    filterStatus === 'all'
      ? orders
      : filterStatus === 'active'
        ? activeOrders
        : filterStatus === 'completed'
          ? completedOrders
          : getOrdersByStatus(filterStatus);

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      await orderService.cancelOrder(orderId, 'Cancelled by buyer');
      // The hook will automatically update due to Firestore listener
    } catch (err) {
      ErrorHandler.logError('CANCEL_ORDER_FAILED', String(err), 'error');
      alert('Failed to cancel order');
    }
  };

  const handleInitiateReturn = (orderId: string) => {
    setSelectedOrder(orderId);
    setIsReturnModalOpen(true);
  };

  const handleSubmitReturn = async () => {
    if (!selectedOrder || !returnReason) {
      alert('Please provide a reason for the return');
      return;
    }

    try {
      await orderService.cancelOrder(selectedOrder, `Return requested: ${returnReason}`);
      setIsReturnModalOpen(false);
      setReturnReason('');
      setSelectedOrder(null);
    } catch (err) {
      ErrorHandler.logError('RETURN_SUBMIT_FAILED', String(err), 'error');
      alert('Failed to submit return request');
    }
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
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-blue-100 text-sm">Total Orders</p>
            <p className="text-2xl font-bold">{orders.length}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Active Orders</p>
            <p className="text-2xl font-bold">{activeOrders.length}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Total Spent</p>
            <p className="text-2xl font-bold">
              ₦{totalSpent.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { value: 'all', label: 'All Orders' },
          { value: 'active', label: 'Active' },
          { value: 'completed', label: 'Completed' },
          { value: 'pending', label: 'Pending' },
          { value: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`px-4 py-2 font-medium transition-colors ${
              filterStatus === tab.value
                ? 'border-b-2 border-blue-500 text-blue-600'
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
            <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg" />
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
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">Order {order.id.substring(0, 8)}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {new Date(order.createdAt?.toDate?.()).toLocaleDateString('en-NG')}
                  </p>
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
                  {/* Items */}
                  <div>
                    <h4 className="font-semibold mb-2">Items</h4>
                    <div className="space-y-2">
                      {order.items?.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-2 bg-gray-50 rounded"
                        >
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                            <p className="text-xs text-gray-500">Seller: {item.sellerName}</p>
                          </div>
                          <p className="font-semibold">
                            ₦{(item.price * item.quantity).toLocaleString('en-NG')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Info */}
                  {order.shippingAddress && (
                    <div>
                      <h4 className="font-semibold mb-2">Shipping Address</h4>
                      <p className="text-gray-700">{order.shippingAddress}</p>
                    </div>
                  )}

                  {/* Tracking */}
                  {order.trackingNumber && (
                    <div>
                      <h4 className="font-semibold mb-2">Tracking Number</h4>
                      <p className="font-mono text-gray-700">{order.trackingNumber}</p>
                    </div>
                  )}

                  {/* Payment Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Payment Status</p>
                      <p className="font-semibold capitalize">{order.paymentStatus}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Estimated Delivery</p>
                      <p className="font-semibold">{order.deliveryDate || 'Not yet shipped'}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Cancel Order
                      </button>
                    )}
                    {order.status === 'delivered' && (
                      <button
                        onClick={() => handleInitiateReturn(order.id)}
                        className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        Return Order
                      </button>
                    )}
                    <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      Contact Seller
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Return Modal */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Return Order</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Return
              </label>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Please describe why you want to return this order..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReturn}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Submit Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerOrdersScreen;
