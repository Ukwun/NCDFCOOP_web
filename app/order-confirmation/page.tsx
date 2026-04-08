'use client';

import { Suspense } from 'react';
import { OrderConfirmationContent } from './OrderConfirmationContent';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';

function LoadingFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: AppColors.background }}
    >
      <div className="text-center">
        <div style={{ fontSize: '48px', marginBottom: AppSpacing.md }}>⏳</div>
        <p
          style={{
            ...AppTextStyles.h3,
            color: AppColors.textPrimary,
          }}
        >
          Loading your order...
        </p>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrderConfirmationContent />
    </Suspense>
  );
}
