"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DevLoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Create a simple dev seller object in localStorage to simulate auth
    const devUser = {
      uid: 'dev-seller-1',
      email: 'dev-seller@local',
      displayName: 'Dev Seller',
      roles: ['seller'],
      selectedRole: 'seller',
      currentRole: 'seller',
      roleSelectionComplete: true,
      onboardingCompleted: true,
    };

    try {
      window.localStorage.setItem('dev_autologin', JSON.stringify(devUser));
      window.localStorage.setItem('selectedRoleOverride', 'seller');
      window.localStorage.setItem('userId', devUser.uid);
      window.localStorage.setItem('userEmail', devUser.email);
      window.localStorage.setItem('userRole', 'seller');
      window.localStorage.setItem('displayName', devUser.displayName);
      window.location.replace('/dev/seed-seller-products');
      return;
    } catch (e) {
      // ignore and fallback to router push
    }

    router.push('/dev/seed-seller-products');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Dev Auto-Login</h1>
        <p className="mt-4">Setting a developer seller session and redirecting to seller product add page...</p>
      </div>
    </div>
  );
}
