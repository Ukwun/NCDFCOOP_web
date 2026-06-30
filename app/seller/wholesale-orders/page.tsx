'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import SellerOrdersScreen from '@/components/SellerOrdersScreen';
import { useAuth } from '@/lib/auth/authContext';
import { USER_ROLES } from '@/lib/constants/database';

export default function SellerWholesaleOrdersPage() {
  const { user } = useAuth();
  if (!user) return null;
  return <ProtectedRoute currentPath="/seller/wholesale-orders" requiredRoles={[USER_ROLES.SELLER, USER_ROLES.FRANCHISE]}><SellerOrdersScreen userId={user.uid} wholesaleOnly /></ProtectedRoute>;
}
