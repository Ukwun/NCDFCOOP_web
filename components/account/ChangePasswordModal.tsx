import { useState } from 'react';

export default function ChangePasswordModal({ open, onClose, onChangePassword }: {
  open: boolean;
  onClose: () => void;
  onChangePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = async () => {
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      // Wrap change to allow some auth reattempts if reauth fails temporarily
      try {
        await onChangePassword(oldPassword, newPassword);
      } catch (err: any) {
        // If Firebase complains about invalid credentials, attempt a gentle refresh and retry once
        if (String(err?.message || '').toLowerCase().includes('invalid credentials') || String(err?.message || '').toLowerCase().includes('auth/invalid-credential')) {
          // Allow the caller to surface the error after retry
          try {
            await onChangePassword(oldPassword, newPassword);
          } catch (e: any) {
            throw e;
          }
        } else {
          throw err;
        }
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Change Password</h2>
        {error && <div className="mb-3 text-red-600">{error}</div>}
        <label className="block mb-4">
          <span className="text-sm text-gray-700 dark:text-gray-300">Current Password</span>
          <input
            type="password"
            value={oldPassword}
            onChange={e => setOldPassword(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </label>
        <label className="block mb-4">
          <span className="text-sm text-gray-700 dark:text-gray-300">New Password</span>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </label>
        <label className="block mb-4">
          <span className="text-sm text-gray-700 dark:text-gray-300">Confirm New Password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </label>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">Cancel</button>
          <button onClick={handleChange} disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60">{saving ? 'Saving...' : 'Change Password'}</button>
        </div>
      </div>
    </div>
  );
}
