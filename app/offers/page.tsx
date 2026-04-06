'use client';

import OfferScreen from '@/components/OfferScreen';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function OffersPage() {
  return (
    <ProtectedRoute currentPath="/offers">
      <OfferScreen />
    </ProtectedRoute>
  );
}
