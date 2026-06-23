'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { USER_ROLES } from '@/lib/constants/database';
import MemberHomeScreen from '@/components/MemberHomeScreen';
import MemberOnly from '@/components/MemberOnly';
import WholesaleBuyerHomeScreen from '@/components/WholesaleBuyerHomeScreen';
import ProtectedRoute from '@/components/ProtectedRoute';
import { RecommendationEngine, ProductRecommendation } from '@/lib/services/recommendationEngine';
import { getExperimentVariant } from '@/lib/services/featureFlagsService';
import RecommendationRail from '@/components/RecommendationRail';

export default function HomePage() {
  const { currentRole, loading, user } = useAuth();
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  const recommendationVariant = user?.uid
    ? getExperimentVariant(user.uid, 'home_recommendation_rail', 60)
    : 'control';

  useEffect(() => {
    const fetchRecommendations = async () => {
      const shouldLoad =
        !!user?.uid &&
        currentRole === USER_ROLES.MEMBER &&
        recommendationVariant === 'treatment';

      if (!shouldLoad) {
        setRecommendations([]);
        return;
      }

      try {
        setRecommendationsLoading(true);
        const recs = await RecommendationEngine.getPersonalizedRecommendations(
          user.uid,
          6
        );
        setRecommendations(recs);
      } catch (error) {
        console.error('Failed to fetch home recommendations:', error);
        setRecommendations([]);
      } finally {
        setRecommendationsLoading(false);
      }
    };

    fetchRecommendations();
  }, [user?.uid, currentRole, recommendationVariant]);

  useEffect(() => {
    if (!loading && currentRole === USER_ROLES.SELLER) {
      router.push('/seller');
    }
  }, [loading, currentRole, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full" />
        </div>
      </div>
    );
  }

  // Render appropriate home screen based on role

  const renderHomeScreen = () => {
    switch (currentRole) {
      case USER_ROLES.MEMBER:
        return (
          <MemberOnly>
            <MemberHomeScreen />
          </MemberOnly>
        );
      case USER_ROLES.INSTITUTIONAL_BUYER:
        return <WholesaleBuyerHomeScreen />;
      default:
        // Default to member home, but still protect it
        return (
          <MemberOnly>
            <MemberHomeScreen />
          </MemberOnly>
        );
    }
  };

  return (
    <ProtectedRoute currentPath="/home">
      <div className="space-y-6">
        {renderHomeScreen()}
        {currentRole === USER_ROLES.MEMBER && recommendationVariant === 'treatment' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <RecommendationRail
              title="Recommended For Your Next Order"
              recommendations={recommendations}
              loading={recommendationsLoading}
              emptyMessage="Recommendations are adapting to your browsing and purchase behavior."
              onOpenProduct={(productId) => router.push(`/products/${productId}`)}
            />
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
