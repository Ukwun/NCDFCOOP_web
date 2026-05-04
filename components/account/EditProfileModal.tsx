import { useState } from 'react';

export default function EditProfileModal({ open, onClose, user, onSave }: {
  open: boolean;
  onClose: () => void;
  user: any;
  onSave: (data: { displayName: string }) => void;
}) {
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ displayName });
    setSaving(false);
    onClose();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
        <label className="block mb-4">
          <span className="text-sm text-gray-700 dark:text-gray-300">Display Name</span>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </label>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
