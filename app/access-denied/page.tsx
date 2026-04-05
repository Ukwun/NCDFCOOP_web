'use client';

import Link from 'next/link';

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🚫</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Access Denied</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          You don't have permission to access this page. You may need to select a different role or contact support.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/home"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Go to Home
          </Link>
          <Link
            href="/role-selection"
            className="px-6 py-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-semibold rounded-lg transition-colors"
          >
            Change Role
          </Link>
        </div>
      </div>
    </div>
  );
}
