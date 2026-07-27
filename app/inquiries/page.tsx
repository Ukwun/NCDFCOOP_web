'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { ToastContainer, useToastNotifications } from '@/lib/ui/loadingStates';
import { InquiryRecord, subscribeBuyerInquiries } from '@/lib/services/inquiryService';
import { openInquiryConversation } from '@/lib/services/conversationService';

export default function BuyerInquiriesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const toast = useToastNotifications();

  const [isLoading, setIsLoading] = useState(true);
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'quoted' | 'accepted' | 'rejected'>('all');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
      return;
    }

    if (!user?.uid) return;

    setIsLoading(true);
    const unsubscribe = subscribeBuyerInquiries(
      user.uid,
      (rows) => {
        setInquiries(rows);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error loading buyer inquiries:', err);
        toast.error('Failed to load inquiry history');
        setInquiries([]);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [loading, user?.uid]);

  const filtered =
    statusFilter === 'all' ? inquiries : inquiries.filter((inquiry) => inquiry.status === statusFilter);

  const getBadgeClass = (status: InquiryRecord['status']) => {
    switch (status) {
      case 'new':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
      case 'quoted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200';
      case 'rejected':
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Inquiry History</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Track supplier responses and quote progress in real time.</p>
          </div>
          <button
            onClick={() => router.push('/products')}
            className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Browse products
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {['all', 'new', 'quoted', 'accepted', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as 'all' | 'new' | 'quoted' | 'accepted' | 'rejected')}
              className={`px-3 py-2 rounded-full text-sm border transition-colors ${
                statusFilter === status
                  ? 'bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:border-gray-100'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-10 text-center text-gray-600 dark:text-gray-300">
            Loading inquiry history...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-10 text-center text-gray-600 dark:text-gray-300">
            No inquiries found yet.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((inquiry) => (
              <article
                key={inquiry.id}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{inquiry.inquiryNumber}</p>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{inquiry.productName}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Seller: {inquiry.sellerName || 'CoopX Seller'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getBadgeClass(inquiry.status)}`}>
                    {inquiry.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 mt-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Type</p>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">{inquiry.kind}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Quantity</p>
                    <p className="font-medium text-gray-900 dark:text-white">{inquiry.quantity}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Budget</p>
                    <p className="font-medium text-gray-900 dark:text-white">₦{(inquiry.budget || 0).toLocaleString()}</p>
                  </div>
                </div>

                {typeof inquiry.quoteAmount === 'number' ? (
                  <p className="mt-3 text-sm text-blue-700 dark:text-blue-300 font-semibold">
                    Seller quote: ₦{inquiry.quoteAmount.toLocaleString()}
                  </p>
                ) : null}

                {inquiry.message ? (
                  <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/40 rounded-lg p-3">{inquiry.message}</p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => router.push(`/products/${inquiry.productId}`)}
                    className="px-3 py-2 rounded-lg text-sm font-semibold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    View product
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const conversationId = await openInquiryConversation(inquiry.id);
                        router.push(`/messages?conversation=${encodeURIComponent(conversationId)}`);
                      } catch (chatError) {
                        toast.error(chatError instanceof Error ? chatError.message : 'The conversation could not be opened.');
                      }
                    }}
                    className="px-3 py-2 rounded-lg text-sm font-semibold border border-emerald-300 text-emerald-800 dark:border-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                  >
                    Open chat
                  </button>
                  {inquiry.status === 'quoted' || inquiry.status === 'accepted' ? (
                    <button
                      onClick={() => router.push('/checkout')}
                      className="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-[#0B6B3A] hover:opacity-90"
                    >
                      Proceed to checkout
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}
