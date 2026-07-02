'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { USER_ROLES } from '@/lib/constants/database';
import { ToastContainer, useToastNotifications } from '@/lib/ui/loadingStates';
import { createNotification } from '@/lib/services/notificationService';
import {
  InquiryRecord,
  InquiryStatus,
  subscribeSellerInquiries,
  updateInquiryStatus,
} from '@/lib/services/inquiryService';

export default function SellerInquiriesPage() {
  const router = useRouter();
  const { user, loading, currentRole } = useAuth();

  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'quoted' | 'accepted'>('all');
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryRecord | null>(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToastNotifications();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
      return;
    }

    if (!loading && user && currentRole !== USER_ROLES.SELLER) {
      router.push('/home');
      return;
    }

    if (!user?.uid || currentRole !== USER_ROLES.SELLER) return;

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeSellerInquiries(
      user.uid,
      (rows) => {
        setInquiries(rows);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error loading inquiries:', err);
        setError('Enquiries are temporarily unavailable. Please refresh to reconnect.');
        setInquiries([]);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [loading, user, currentRole]);

  const filteredInquiries =
    filterStatus === 'all' ? inquiries : inquiries.filter((i) => i.status === filterStatus);

  const stats = {
    total: inquiries.length,
    new: inquiries.filter((i) => i.status === 'new').length,
    quoted: inquiries.filter((i) => i.status === 'quoted').length,
    accepted: inquiries.filter((i) => i.status === 'accepted').length,
  };

  const getStatusColor = (status: InquiryRecord['status']) => {
    switch (status) {
      case 'new':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'quoted':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'accepted':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'rejected':
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const formatDate = (seconds?: number) => {
    if (!seconds) return 'Just now';
    return new Date(seconds * 1000).toLocaleString();
  };

  const updateStatus = async (inquiry: InquiryRecord, status: InquiryStatus) => {
    try {
      setIsSaving(true);
      await updateInquiryStatus(inquiry.id, status);

      await createNotification(inquiry.buyerId, {
        title: `Inquiry update: ${inquiry.productName}`,
        message: `Your inquiry ${inquiry.inquiryNumber} is now ${status}.`,
        type: 'message',
        read: false,
        data: {
          inquiryId: inquiry.id,
          productId: inquiry.productId,
          link: '/inquiries',
        },
      });

      setSelectedInquiry(null);
      toast.success(`Inquiry marked as ${status}`);
    } catch (err) {
      console.error('Error updating inquiry status:', err);
      toast.error('We could not update this enquiry yet. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  const submitQuote = async () => {
    if (!selectedInquiry) return;

    const parsed = Number(quoteAmount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.warning('Please enter a valid quote amount');
      return;
    }

    try {
      setIsSaving(true);
      await updateInquiryStatus(selectedInquiry.id, 'quoted', parsed);

      await createNotification(selectedInquiry.buyerId, {
        title: `Quote received: ${selectedInquiry.productName}`,
        message: `Seller quoted ₦${parsed.toLocaleString()} for inquiry ${selectedInquiry.inquiryNumber}.`,
        type: 'message',
        read: false,
        data: {
          inquiryId: selectedInquiry.id,
          productId: selectedInquiry.productId,
          link: '/inquiries',
        },
      });

      setSelectedInquiry(null);
      setQuoteAmount('');
      toast.success('Quote sent successfully');
    } catch (err) {
      console.error('Error sending quote:', err);
      toast.error('The quote was not sent yet. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300">Loading inquiries...</div>
      </div>
    );
  }

  if (!user || currentRole !== USER_ROLES.SELLER) {
    return null;
  }

  return (
    <ProtectedRoute currentPath="/seller/inquiries" requiredRoles={[USER_ROLES.SELLER]}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-2xl hover:text-blue-600">
            ←
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">💬 Bulk Inquiries</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Respond to real buyer inquiry and chat requests</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {error ? (
          <div className="rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-200 p-4">{error}</div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-l-4 border-blue-500">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Total Inquiries</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-l-4 border-red-500">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">New</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.new}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-l-4 border-yellow-500">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Quoted</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.quoted}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-l-4 border-green-500">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Accepted</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.accepted}</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {['all', 'new', 'quoted', 'accepted'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as 'all' | 'new' | 'quoted' | 'accepted')}
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

        {filteredInquiries.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center text-gray-600 dark:text-gray-300">
            No inquiries yet.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInquiries.map((inquiry) => (
              <div key={inquiry.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{inquiry.inquiryNumber}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {inquiry.buyerName} • {formatDate(inquiry.createdAt?.seconds)}
                    </p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(inquiry.status)}`}>
                    {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Product</p>
                    <p className="font-medium text-gray-900 dark:text-white">{inquiry.productName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">{inquiry.kind}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Quantity Requested</p>
                    <p className="font-medium text-gray-900 dark:text-white">{inquiry.quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Budget</p>
                    <p className="font-medium text-gray-900 dark:text-white">₦{inquiry.budget.toLocaleString()}</p>
                  </div>
                </div>

                {inquiry.message ? (
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">"{inquiry.message}"</p>
                  </div>
                ) : null}

                <div className="flex gap-2 flex-wrap">
                  {inquiry.status === 'new' ? (
                    <>
                      <button
                        onClick={() => setSelectedInquiry(inquiry)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                      >
                        Send Quote
                      </button>
                      <button
                        onClick={() => updateStatus(inquiry, 'rejected')}
                        disabled={isSaving}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60"
                      >
                        Cannot Fulfill
                      </button>
                    </>
                  ) : null}

                  {inquiry.status === 'quoted' ? (
                    <button
                      onClick={() => updateStatus(inquiry, 'accepted')}
                      disabled={isSaving}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-60"
                    >
                      Confirm Order
                    </button>
                  ) : null}

                  <button
                    onClick={() => router.push('/notifications')}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Contact Buyer →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedInquiry ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Send Quote</h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Inquiry</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedInquiry.inquiryNumber}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Product</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedInquiry.productName}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Quantity</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedInquiry.quantity}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Quote Price (₦) *</label>
                <input
                  type="number"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  placeholder="Enter your total price"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
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
                onClick={submitQuote}
                disabled={isSaving}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-60"
              >
                {isSaving ? 'Sending...' : 'Send Quote'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
    </ProtectedRoute>
  );
}
