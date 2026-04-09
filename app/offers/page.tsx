'use client';

export const dynamic = 'force-dynamic';

import OfferScreen from '@/components/OfferScreen';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function OffersPage() {
  return (
    <ProtectedRoute currentPath="/offers">
      <OfferScreen />
    </ProtectedRoute>
  );
}
