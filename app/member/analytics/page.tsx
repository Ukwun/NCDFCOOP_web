'use client';

export const dynamic = 'force-dynamic';

import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import ProtectedRoute from '@/components/ProtectedRoute';
import { USER_ROLES } from '@/lib/constants/database';

export default function MemberAnalyticsPage() {
  return (
    <ProtectedRoute
      currentPath="/member/analytics"
      requiredRoles={[USER_ROLES.MEMBER]}
    >
      <AnalyticsDashboard
        timeRange="month"
        refreshInterval={60000}
        showIssueDetection={false}
      />
    </ProtectedRoute>
  );
}
