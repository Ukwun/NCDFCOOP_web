'use client';

import { useAuth } from '@/lib/auth/authContext';
import { USER_ROLES } from '@/lib/constants/database';
import MemberHomeScreen from '@/components/MemberHomeScreen';
import WholesaleBuyerHomeScreen from '@/components/WholesaleBuyerHomeScreen';
import SellerDashboardHomeScreen from '@/components/SellerDashboardHomeScreen';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function HomePage() {
  const { currentRole, loading } = useAuth();

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
        return <MemberHomeScreen />;
      case USER_ROLES.INSTITUTIONAL_BUYER:
        return <WholesaleBuyerHomeScreen />;
      case USER_ROLES.SELLER:
        return <SellerDashboardHomeScreen />;
      default:
        return <MemberHomeScreen />;
    }
  };

  return (
    <ProtectedRoute currentPath="/home">
      {renderHomeScreen()}
    </ProtectedRoute>
  );
}
