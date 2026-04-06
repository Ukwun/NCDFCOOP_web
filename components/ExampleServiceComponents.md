/**
 * Example Components Using Advanced Services
 * Practical implementations of activity tracking, notifications, rewards, and favorites
 */

// ============================================================================
// 1. NotificationCenter Component - Display and manage user notifications
// ============================================================================

'use client';

import { useState } from 'react';
import { useNotifications } from '@/lib/hooks';
import { Bell, X, CheckCircle2, AlertCircle, Gift, MessageSquare, Package } from 'lucide-react';

interface NotificationCenterProps {
  userId: string;
}

export function NotificationCenter({ userId }: NotificationCenterProps) {
  const { notifications, unreadCount, loading, markAsRead, getNotificationsByType } =
    useNotifications({ userId, refreshInterval: 30000 });
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'promotion':
        return <Gift className="w-5 h-5 text-green-500" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-purple-500" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white shadow-xl rounded-lg z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-lg">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No notifications</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => notification.id && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(
                          notification.createdAt.seconds * 1000
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 2. RewardsCard Component - Display user points and available rewards
// ============================================================================

'use client';

import { useRewards } from '@/lib/hooks';
import { Gift, TrendingUp, Award } from 'lucide-react';

interface RewardsCardProps {
  userId: string;
}

export function RewardsCard({ userId }: RewardsCardProps) {
  const {
    points,
    rewards,
    loading,
    getAffordableRewards,
    getTotalEarned,
    getTotalRedeemed,
  } = useRewards({ userId });

  if (loading) return <div className="p-4">Loading rewards...</div>;

  const affordableRewards = getAffordableRewards();
  const totalEarned = getTotalEarned();
  const totalRedeemed = getTotalRedeemed();

  return (
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-6 shadow-lg">
      {/* Points Display */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Award className="w-6 h-6" />
            Your Points
          </h2>
        </div>
        <div className="text-4xl font-bold mb-1">
          {points?.availablePoints || 0}
        </div>
        <p className="text-purple-100 text-sm">
          {points?.totalPoints || 0} total earned • {totalRedeemed || 0} redeemed
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-pink-200">
        <div>
          <p className="text-purple-100 text-sm">Earned</p>
          <p className="text-xl font-semibold">{totalEarned || 0}</p>
        </div>
        <div>
          <p className="text-purple-100 text-sm">Redeemed</p>
          <p className="text-xl font-semibold">{totalRedeemed || 0}</p>
        </div>
        <div>
          <p className="text-purple-100 text-sm">Available</p>
          <p className="text-xl font-semibold">{affordableRewards.length}</p>
        </div>
      </div>

      {/* Available Rewards Preview */}
      <div>
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Gift className="w-4 h-4" />
          What You Can Redeem
        </h3>
        {affordableRewards.length > 0 ? (
          <div className="space-y-2">
            {affordableRewards.slice(0, 2).map((reward) => (
              <div key={reward.id} className="flex justify-between items-center">
                <span className="text-sm">{reward.name}</span>
                <span className="text-xs bg-purple-700 px-2 py-1 rounded">
                  {reward.pointsRequired} pts
                </span>
              </div>
            ))}
            {affordableRewards.length > 2 && (
              <p className="text-xs text-purple-100">
                +{affordableRewards.length - 2} more...
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-purple-100">
            Complete purchases to earn rewards
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 3. FavoritesButton Component - Quick favorite toggle with heart icon
// ============================================================================

'use client';

import { useState } from 'react';
import { useFavorites } from '@/lib/hooks';
import { Heart } from 'lucide-react';

interface FavoritesButtonProps {
  userId: string;
  productId: string;
  productData: Omit<any, 'id' | 'userId' | 'productId' | 'addedAt'>;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function FavoritesButton({
  userId,
  productId,
  productData,
  size = 'md',
  showLabel = false,
}: FavoritesButtonProps) {
  const { isFavorited, toggleFavorite } = useFavorites({ userId });
  const [loading, setLoading] = useState(false);

  const favorited = isFavorited(productId);

  const handleClick = async () => {
    setLoading(true);
    try {
      await toggleFavorite(productId, productData);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-2 transition-colors ${
        favorited ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
      }`}
    >
      <Heart
        className={`${sizeClasses[size]} ${favorited ? 'fill-current' : ''}`}
      />
      {showLabel && <span className="text-sm">{favorited ? 'Favorited' : 'Favorite'}</span>}
    </button>
  );
}

// ============================================================================
// 4. ProductViewTracker Component - Automatically tracks product views
// ============================================================================

'use client';

import { useEffect } from 'react';
import { useActivityTracking } from '@/lib/hooks';

interface ProductViewTrackerProps {
  userId: string;
  productId: string;
  productName: string;
  category?: string;
  children: React.ReactNode;
}

export function ProductViewTracker({
  userId,
  productId,
  productName,
  category,
  children,
}: ProductViewTrackerProps) {
  const { trackProductView } = useActivityTracking({ userId });

  useEffect(() => {
    // Track view when component mounts
    trackProductView(productId, productName, category);
  }, [productId, productName, category, trackProductView]);

  return <>{children}</>;
}

// ============================================================================
// 5. SearchTracker Component - Tracks search queries
// ============================================================================

'use client';

import { useActivityTracking } from '@/lib/hooks';
import { useCallback } from 'react';
import { Search } from 'lucide-react';

interface SearchTrackerProps {
  userId: string;
  onSearch?: (query: string, results: number) => void;
}

export function SearchTracker({ userId, onSearch }: SearchTrackerProps) {
  const { trackProductSearch } = useActivityTracking({ userId });

  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) return;

      // Track the search
      trackProductSearch(query);

      // Call parent callback if provided
      if (onSearch) {
        onSearch(query, 0); // Results count would be updated after fetch
      }
    },
    [trackProductSearch, onSearch]
  );

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search products..."
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSearch((e.target as HTMLInputElement).value);
          }
        }}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
      />
      <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
    </div>
  );
}

// ============================================================================
// 6. RedemptionModal Component - Handle points redemption
// ============================================================================

'use client';

import { useState } from 'react';
import { useRewards } from '@/lib/hooks';
import { redeemPoints } from '@/lib/services';
import { X } from 'lucide-react';

interface RedemptionModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RedemptionModal({ userId, isOpen, onClose }: RedemptionModalProps) {
  const { rewards, points, fetchPoints } = useRewards({ userId });
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleRedeem = async () => {
    if (!selectedReward || !points) return;

    const reward = rewards.find((r) => r.id === selectedReward);
    if (!reward) return;

    setLoading(true);
    try {
      await redeemPoints(
        userId,
        reward.pointsRequired,
        selectedReward,
        `Redeemed: ${reward.name}`
      );

      setMessage({
        type: 'success',
        text: `Successfully redeemed ${reward.name}!`,
      });

      await fetchPoints();

      setTimeout(() => {
        onClose();
        setSelectedReward(null);
      }, 2000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Redemption failed. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedRewardObj = rewards.find((r) => r.id === selectedReward);
  const canRedeem = selectedRewardObj && points && points.availablePoints >= selectedRewardObj.pointsRequired;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Redeem Rewards</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {message && (
          <div
            className={`p-3 rounded mb-4 text-sm ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-3 mb-6">
          {rewards.map((reward) => (
            <label
              key={reward.id}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedReward === reward.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="reward"
                value={reward.id}
                checked={selectedReward === reward.id}
                onChange={(e) => setSelectedReward(e.target.value)}
                className="mr-3"
              />
              <span className="font-medium">{reward.name}</span>
              <span className="text-sm text-gray-600 ml-2">
                {reward.pointsRequired} points
              </span>
            </label>
          ))}
        </div>

        {selectedRewardObj && (
          <div className="bg-gray-50 p-3 rounded mb-6 text-sm">
            <p className="text-gray-600 mb-2">{selectedRewardObj.description}</p>
            <p className="font-medium">
              {canRedeem ? 'You can redeem this' : `You need ${selectedRewardObj.pointsRequired - (points?.availablePoints || 0)} more points`}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleRedeem}
            disabled={!canRedeem || loading}
            className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
              canRedeem && !loading
                ? 'bg-purple-500 hover:bg-purple-600'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {loading ? 'Redeeming...' : 'Redeem'}
          </button>
        </div>
      </div>
    </div>
  );
}
