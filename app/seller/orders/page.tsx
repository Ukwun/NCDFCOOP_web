'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '@/lib/auth/authContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { USER_ROLES } from '@/lib/constants/database';
import SellerOrdersScreen from '@/components/SellerOrdersScreen';

export default function SellerOrdersPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <ProtectedRoute
      currentPath="/seller/orders"
      requiredRoles={[USER_ROLES.SELLER, USER_ROLES.FRANCHISE]}
    >
      <SellerOrdersScreen userId={user.uid} />
    </ProtectedRoute>
  );
}
