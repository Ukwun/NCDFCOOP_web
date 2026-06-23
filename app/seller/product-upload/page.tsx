'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SellerProductUploadRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/seller/products/add');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg">
        <p className="text-lg text-gray-700 dark:text-gray-200">
          Redirecting to the improved seller upload page…
        </p>
      </div>
    </div>
  );
}
