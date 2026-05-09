'use client';

import { ProductRecommendation } from '@/lib/services/recommendationEngine';

interface RecommendationRailProps {
  title: string;
  recommendations: ProductRecommendation[];
  loading?: boolean;
  emptyMessage?: string;
  onOpenProduct?: (productId: string) => void;
}

export default function RecommendationRail({
  title,
  recommendations,
  loading = false,
  emptyMessage = 'No recommendations available yet.',
  onOpenProduct,
}: RecommendationRailProps) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">AI-curated</span>
      </div>

      {loading && (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading recommendations...</div>
      )}

      {!loading && recommendations.length === 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</div>
      )}

      {!loading && recommendations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {recommendations.slice(0, 6).map((rec) => (
            <button
              key={rec.productId}
              type="button"
              onClick={() => onOpenProduct?.(rec.productId)}
              className="text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors"
            >
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {rec.productName || rec.productId}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{rec.reason}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Score: {Math.round(rec.score)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
