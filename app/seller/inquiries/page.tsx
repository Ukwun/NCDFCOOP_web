'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Inquiry {
  id: string;
  inquiryNumber: string;
  buyer: string;
  product: string;
  quantity: string;
  budget: number;
  deliveryDate: string;
  status: 'new' | 'quoted' | 'accepted' | 'rejected';
  message?: string;
  receivedDate: string;
}

export default function SellerInquiriesPage() {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState('all');
  const [inquiries, setInquiries] = useState<Inquiry[]>([
    {
      id: '1',
      inquiryNumber: 'INQ-2026-0521',
      buyer: 'Lagos Wholesale Foods',
      product: 'Premium Milled Rice',
      quantity: '100 bags (25kg each)',
      budget: 1200000,
      deliveryDate: 'Apr 5, 2026',
      status: 'new',
      message:
        'Need high-quality rice with fast delivery. Want to establish long-term supply relationship.',
      receivedDate: 'Mar 21, 2026',
    },
    {
      id: '2',
      inquiryNumber: 'INQ-2026-0520',
      buyer: 'Artisan Food Co',
      product: 'Organic Cocoa Powder',
      quantity: '50 kg',
      budget: 210000,
      deliveryDate: 'Apr 10, 2026',
      status: 'quoted',
      receivedDate: 'Mar 20, 2026',
    },
    {
      id: '3',
      inquiryNumber: 'INQ-2026-0519',
      buyer: 'Community Store Network',
      product: 'Fresh Ginger Root',
      quantity: '200 kg',
      budget: 700000,
      deliveryDate: 'Apr 1, 2026',
      status: 'accepted',
      receivedDate: 'Mar 19, 2026',
    },
    {
      id: '4',
      inquiryNumber: 'INQ-2026-0518',
      buyer: 'Organic Wellness Ltd',
      product: 'Pure Shea Butter',
      quantity: '100 liters',
      budget: 680000,
      deliveryDate: 'Apr 8, 2026',
      status: 'rejected',
      receivedDate: 'Mar 18, 2026',
    },
  ]);

  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [quoteAmount, setQuoteAmount] = useState('');

  const filteredInquiries =
    filterStatus === 'all'
      ? inquiries
      : inquiries.filter((i) => i.status === filterStatus);

  const stats = {
    total: inquiries.length,
    new: inquiries.filter((i) => i.status === 'new').length,
    quoted: inquiries.filter((i) => i.status === 'quoted').length,
    accepted: inquiries.filter((i) => i.status === 'accepted').length,
  };

  const getStatusColor = (status: Inquiry['status']) => {
    switch (status) {
      case 'new':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'quoted':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'accepted':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'rejected':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const submitQuote = (inquiryId: string) => {
    if (!quoteAmount) {
      alert('Please enter a quote amount');
      return;
    }

    setInquiries((prev) =>
      prev.map((i) =>
        i.id === inquiryId ? { ...i, status: 'quoted' as const } : i
      )
    );

    setSelectedInquiry(null);
    setQuoteAmount('');
    alert('Quote submitted successfully!');
  };

  const updateInquiryStatus = (inquiryId: string, status: Inquiry['status']) => {
    setInquiries((prev) =>
      prev.map((i) => (i.id === inquiryId ? { ...i, status } : i))
    );
    setSelectedInquiry(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-2xl hover:text-blue-600"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              💬 Bulk Inquiries
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Respond to bulk purchase requests from buyers
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-l-4 border-blue-500">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Total Inquiries</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-l-4 border-red-500">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">New</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.new}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-l-4 border-yellow-500">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Quoted</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.quoted}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-l-4 border-green-500">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Accepted</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.accepted}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'new', 'quoted', 'accepted'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Inquiries List */}
        <div className="space-y-4">
          {filteredInquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {inquiry.inquiryNumber}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {inquiry.buyer} • {inquiry.receivedDate}
                  </p>
                </div>

                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                    inquiry.status
                  )}`}
                >
                  {inquiry.status.charAt(0).toUpperCase() +
                    inquiry.status.slice(1)}
                </span>
              </div>

              {/* Inquiry Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Product</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {inquiry.product}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Quantity Requested
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {inquiry.quantity}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Budget
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    ₦{inquiry.budget.toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Needed By
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {inquiry.deliveryDate}
                  </p>
                </div>
              </div>

              {inquiry.message && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    "{inquiry.message}"
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                {inquiry.status === 'new' && (
                  <>
                    <button
                      onClick={() => setSelectedInquiry(inquiry)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                    >
                      Send Quote
                    </button>
                    <button
                      onClick={() =>
                        updateInquiryStatus(inquiry.id, 'rejected')
                      }
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cannot Fulfill
                    </button>
                  </>
                )}

                {inquiry.status === 'quoted' && (
                  <>
                    <button
                      onClick={() =>
                        updateInquiryStatus(inquiry.id, 'accepted')
                      }
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                    >
                      Confirm Order
                    </button>
                    <button
                      onClick={() => setSelectedInquiry(inquiry)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Edit Quote
                    </button>
                  </>
                )}

                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
                  Contact Buyer →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quote Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Send Quote
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Inquiry
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedInquiry.inquiryNumber}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Product
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedInquiry.product}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Quantity
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedInquiry.quantity}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Quote Price (₦) *
                </label>
                <input
                  type="number"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  placeholder="Enter your total price"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Tip:</strong> Include all costs (production, packaging,
                  delivery). Competitive quotes are more likely to be accepted.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setSelectedInquiry(null);
                  setQuoteAmount('');
                }}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => submitQuote(selectedInquiry.id)}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Send Quote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
