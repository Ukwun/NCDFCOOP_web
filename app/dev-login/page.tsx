"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const ROLE_CONFIG: Record<string, { roleKey: string; title: string; redirectTo: string; label: string }> = {
  member: {
    roleKey: 'member',
    title: 'Member Buyer',
    redirectTo: '/home',
    label: 'Dev Member',
  },
  wholesale: {
    roleKey: 'institutional_buyer',
    title: 'Wholesale Buyer',
    redirectTo: '/home',
    label: 'Dev Wholesale',
  },
  seller: {
    roleKey: 'seller',
    title: 'Seller',
    redirectTo: '/dev/seed-seller-products',
    label: 'Dev Seller',
  },
};

function buildDevUser(roleKey: string, title: string) {
  const uid = `dev-${roleKey}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    uid,
    email: `dev-${roleKey}@local`,
    displayName: `Dev ${title}`,
    roles: [roleKey],
    selectedRole: roleKey,
    currentRole: roleKey,
    roleSelectionComplete: true,
    onboardingCompleted: true,
  };
}

export default function DevLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusMessage, setStatusMessage] = useState('Preparing developer login...');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const roleQuery = useMemo(() => searchParams.get('role') || '', [searchParams]);
  const selectedRoleConfig = ROLE_CONFIG[roleQuery.toLowerCase()];

  useEffect(() => {
    if (!selectedRoleConfig) {
      setStatusMessage('Select a developer role to simulate authentication.');
      return;
    }

    const devUser = buildDevUser(selectedRoleConfig.roleKey, selectedRoleConfig.title);
    setStatusMessage(`Activating ${selectedRoleConfig.title} session...`);

    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem('dev_autologin', JSON.stringify(devUser));
        window.localStorage.setItem('selectedRoleOverride', devUser.selectedRole);
        window.localStorage.setItem('userId', devUser.uid);
        window.localStorage.setItem('userEmail', devUser.email);
        window.localStorage.setItem('userRole', devUser.selectedRole);
        window.localStorage.setItem('displayName', devUser.displayName);
        window.location.replace(selectedRoleConfig.redirectTo);
      } catch (error) {
        console.warn('Dev login fallback error:', error);
        router.push(selectedRoleConfig.redirectTo);
      }
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [router, selectedRoleConfig]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dev Auto-Login</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Use this page to simulate authenticated member, wholesale, or seller sessions in local development.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {Object.entries(ROLE_CONFIG).map(([key, config]) => (
            <button
              key={key}
              type="button"
              onClick={() => router.push(`/dev-login?role=${key}`)}
              className="rounded-2xl border border-gray-300 bg-gray-50 px-4 py-4 text-left text-sm font-semibold text-gray-800 transition hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:border-blue-400"
            >
              <div className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">{config.label}</div>
              <div className="mt-2 text-lg text-gray-900 dark:text-white">{config.title}</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{config.redirectTo}</div>
            </button>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
          {selectedRoleConfig ? (
            <p>{statusMessage}</p>
          ) : (
            <p>{statusMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}
