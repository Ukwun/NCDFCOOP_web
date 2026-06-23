'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { useAuth } from '@/lib/auth/authContext';
import { auth } from '@/lib/firebase/config';
import { USER_ROLES } from '@/lib/constants/database';
import ProtectedRoute from '@/components/ProtectedRoute';
import EditProfileModal from '@/components/account/EditProfileModal';
import ChangePasswordModal from '@/components/account/ChangePasswordModal';

export default function AccountPage() {
  const { user, currentRole, logout, updateUserProfile } = useAuth();
  const router = useRouter();

  const [editOpen, setEditOpen] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleSaveProfile = async (data: { displayName: string }) => {
    if (!data.displayName.trim()) {
      throw new Error('Display name cannot be empty');
    }

    await updateUserProfile(data.displayName.trim());
    setStatusMessage('Profile updated successfully.');
  };

  const handleChangePassword = async (oldPw: string, newPw: string) => {
    if (!user?.email || !auth?.currentUser) {
      throw new Error('You must be signed in to change your password');
    }

    if (newPw.length < 8) {
      throw new Error('New password must be at least 8 characters long');
    }

    const credential = EmailAuthProvider.credential(user.email, oldPw);
    await reauthenticateWithCredential(auth.currentUser, credential);
    await updatePassword(auth.currentUser, newPw);
    setStatusMessage('Password changed successfully.');
  };

  const handleLogout = async () => {
    try {
      await logout();
      // After sign out, route to sign-in not onboarding
      router.push('/signin');
    } catch (error) {
      console.error('Logout error:', error);
      setStatusMessage('Unable to log out right now. Please retry.');
    }
  };

  const handleDeleteAccountRequest = () => {
    setStatusMessage('Account deletion workflow opened in support inbox.');
    router.push('/inquiries');
  };

  const formatUserCode = (uid: string) => {
    const digits = uid.replace(/\D/g, '');
    if (digits.length >= 6) {
      return digits.slice(0, 6);
    }
    if (digits.length >= 4) {
      return digits.slice(0, 4);
    }
    const fallback = uid.replace(/[^A-Z0-9]/gi, '').slice(0, 6).toUpperCase();
    return fallback || uid.slice(0, 6).toUpperCase();
  };

  return (
    <ProtectedRoute currentPath="/account">
      <div className="min-h-screen bg-[#F4F7FA] dark:bg-gray-900 p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-5">
          <section className="rounded-2xl bg-gradient-to-r from-[#164A2E] via-[#1E7F4E] to-[#2A9B61] text-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest opacity-80">Identity & Access</p>
                <h1 className="text-3xl font-bold">Profile Command Center</h1>
                <p className="mt-2 text-sm opacity-90">
                  Manage account identity, security credentials, and role-specific operational shortcuts.
                </p>
              </div>
              <button
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#164A2E] hover:bg-[#E8F6EE]"
                onClick={() => router.push('/settings')}
              >
                Open Settings
              </button>
            </div>
          </section>

          {statusMessage ? (
            <div className="rounded-xl border border-[#B6DCC6] bg-white px-4 py-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#164A2E]">Status:</span>
                <span>{statusMessage}</span>
                <button
                  onClick={() => setStatusMessage('')}
                  className="ml-auto rounded-md px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : null}

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Display Name</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{user?.displayName || 'User'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Email</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{user?.email || 'No email'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Current Role</p>
                <p className="mt-1 text-lg font-semibold text-[#164A2E] dark:text-[#8FD8AE] capitalize">{currentRole || 'member'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Email Verification</p>
                <p className={`mt-1 text-lg font-semibold ${user?.emailVerified ? 'text-green-600' : 'text-amber-600'}`}>
                  {user?.emailVerified ? 'Verified' : 'Pending Verification'}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/40">
              <p className="text-xs text-gray-500 dark:text-gray-400">User Code</p>
              <p className="mt-1 font-mono text-sm text-gray-800 dark:text-gray-200">{user?.uid ? formatUserCode(user.uid) : 'Unavailable'}</p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ActionButton label="Edit Profile" onClick={() => setEditOpen(true)} />
              <ActionButton label="Change Password" onClick={() => setChangePwOpen(true)} />
              <ActionButton label="Notifications" onClick={() => router.push('/notifications')} />
              <ActionButton label="Inquiry History" onClick={() => router.push('/inquiries')} />

              {currentRole === USER_ROLES.INSTITUTIONAL_BUYER ? (
                <>
                  <ActionButton label="Wholesale Dashboard" onClick={() => router.push('/home')} />
                  <ActionButton label="Wholesale Orders" onClick={() => router.push('/wholesale/orders')} />
                </>
              ) : null}

              {currentRole === USER_ROLES.MEMBER ? (
                <ActionButton label="My Analytics" onClick={() => router.push('/member/analytics')} />
              ) : null}

              {(currentRole === USER_ROLES.ADMIN || currentRole === USER_ROLES.STAFF || currentRole === USER_ROLES.OPERATOR) ? (
                <ActionButton label="Operations Analytics" onClick={() => router.push('/analytics')} />
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-700 dark:bg-red-900/30">
            <h2 className="text-lg font-bold text-red-800 dark:text-red-200">Account Actions</h2>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">Security-sensitive actions for your live account.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={handleLogout}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Logout
              </button>
              <button
                onClick={handleDeleteAccountRequest}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 dark:border-red-600 dark:text-red-200 dark:hover:bg-red-800/50"
              >
                Request Account Deletion
              </button>
            </div>
          </section>

          <EditProfileModal
            open={editOpen}
            onClose={() => setEditOpen(false)}
            user={user}
            onSave={handleSaveProfile}
          />
          <ChangePasswordModal
            open={changePwOpen}
            onClose={() => setChangePwOpen(false)}
            onChangePassword={handleChangePassword}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}

function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-left text-sm font-semibold text-gray-700 transition hover:border-[#A5CEB5] hover:bg-[#F4FBF7] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
    >
      {label}
    </button>
  );
}
