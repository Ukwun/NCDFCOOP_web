'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/authContext';
import { getActiveOffers, Offer } from '@/lib/services/productService';
import OptimizedImage from '@/components/OptimizedImage';
import { getPromotionalImage } from '@/lib/optimization/promotionalImages';

export default function OfferScreen() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        setError(null);
        const activeOffers = await getActiveOffers();
        setOffers(activeOffers);
      } catch (err) {
        console.error('Error fetching offers:', err);
        setError('Failed to load offers. Please try again.');
        // Fallback to mock data if Firebase is not configured
        setOffers([
          {
            id: '1',
            title: 'Fresh Vegetables Bundle',
            description: 'Save ₦2,500 on fresh farm produce',
            discount: 30,
            status: 'active',
            endDate: { toDate: () => new Date(Date.now() + 3 * 60 * 60 * 1000) } as any,
            startDate: { toDate: () => new Date() } as any,
          },
          {
            id: '2',
            title: 'Premium Grains Package',
            description: 'Bulk buy at wholesale rates',
            discount: 25,
            status: 'active',
            endDate: { toDate: () => new Date(Date.now() + 5 * 60 * 60 * 1000) } as any,
            startDate: { toDate: () => new Date() } as any,
          },
          {
            id: '3',
            title: 'Double Points Weekend',
            description: 'Earn 2 points for every ₦1 spent',
            discount: 100,
            status: 'active',
            endDate: { toDate: () => new Date(Date.now() + 48 * 60 * 60 * 1000) } as any,
            startDate: { toDate: () => new Date() } as any,
          },
          {
            id: '4',
            title: 'Free Shipping ₦5000+',
            description: 'No minimum order during member week',
            discount: 0,
            status: 'active',
            endDate: { toDate: () => new Date(Date.now() + 24 * 60 * 60 * 1000) } as any,
            startDate: { toDate: () => new Date() } as any,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOffers();
    }
  }, [user]);

  const filteredOffers = offers.filter(
    (offer) =>
      offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTimeRemaining = (endDate: any) => {
    if (!endDate) return 'Expires soon';
    const end = endDate.toDate ? endDate.toDate() : new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff < 60 * 60 * 1000) {
      return `Expires in ${Math.floor(diff / (60 * 1000))} minutes`;
    } else if (diff < 24 * 60 * 60 * 1000) {
      return `Expires in ${Math.floor(diff / (60 * 60 * 1000))} hours`;
    } else {
      return `Expires in ${Math.floor(diff / (24 * 60 * 60 * 1000))} days`;
    }
  };

  const getColorClass = (discount: number) => {
    const colors: Record<number, string> = {
      30: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      25: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
      100: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
      0: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    };
    return colors[discount] || colors[0];
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🎁 Offers & Deals</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Member Exclusive Offers and Flash Deals</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search deals..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Loading offers...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Offers Grid */}
      {!loading && filteredOffers.length > 0 ? (
        <div className="space-y-4">
          {filteredOffers.map((offer) => (
            <div
              key={offer.id}
              className={`border rounded-lg p-4 flex justify-between items-start hover:shadow-lg transition-shadow ${getColorClass(
                offer.discount
              )}`}
            >
              <div className="flex gap-4 flex-1 items-start">
                <OptimizedImage
                  src={getPromotionalImage('offer', offer.discount)}
                  alt={offer.title}
                  type="offer"
                  width={100}
                  height={100}
                  className="rounded-lg flex-shrink-0"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white">{offer.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{offer.description}</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
                    {getTimeRemaining(offer.endDate)}
                  </p>
                  {offer.code && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Code: <span className="font-mono font-bold">{offer.code}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="ml-4">
                <div className="bg-gradient-to-br from-red-400 to-red-600 text-white rounded-lg px-3 py-2 text-center min-w-fit">
                  <div className="font-bold text-lg">
                    {offer.discount === 100 ? '2x Points' : `${offer.discount}%`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No offers found matching your search.</p>
        </div>
      ) : null}
    </div>
  );
}
