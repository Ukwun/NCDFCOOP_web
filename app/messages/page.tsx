'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import MessageScreen from '@/components/MessageScreen';
import { USER_ROLES } from '@/lib/constants/database';

export default function MessagesPage() {
  return (
    <ProtectedRoute
      currentPath="/messages"
      requiredRoles={[USER_ROLES.MEMBER, USER_ROLES.SELLER, USER_ROLES.INSTITUTIONAL_BUYER]}
    >
      <MessageScreen />
    </ProtectedRoute>
  );
}
