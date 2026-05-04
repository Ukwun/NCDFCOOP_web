"use client";

import { useGlobalSettings } from '@/lib/context/GlobalSettingsContext';

export default function SellerSettingsPage() {
  const { settings, loading, updateSettings } = useGlobalSettings();

  if (loading) {
    return <div className="max-w-2xl mx-auto mt-10 p-6 text-center text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white dark:bg-gray-900 rounded shadow">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Global Website Settings</h1>
      <div className="mb-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={!!settings?.darkMode}
            onChange={() => updateSettings({ darkMode: !settings?.darkMode })}
            className="form-checkbox h-5 w-5 text-blue-600"
          />
          <span className="text-gray-800 dark:text-gray-200">Enable Dark Mode (example)</span>
        </label>
      </div>
      {/* Add more global settings here */}
      <div className="mt-8 text-gray-500 text-sm">
        <p>All changes here affect the entire website in real time.</p>
      </div>
    </div>
  );
}
