'use client';

export const dynamic = 'force-dynamic';

import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import ProtectedRoute from '@/components/ProtectedRoute';
import { USER_ROLES } from '@/lib/constants/database';

export default function AnalyticsPage() {
  return (
    <ProtectedRoute
      currentPath="/analytics"
      requiredRoles={[
        USER_ROLES.ADMIN,
        USER_ROLES.STAFF,
        USER_ROLES.OPERATOR,
      ]}
    >
      <AnalyticsDashboard timeRange="month" refreshInterval={60000} showIssueDetection={true} />
    </ProtectedRoute>
  );
}
